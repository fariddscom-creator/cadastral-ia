import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { buildGeoreferenceFileViews } from '../lib/georeference-view';
import { pdfPageImages, isGenericGeoreferenceLabel, sanitizeGeoreferenceEvidence } from '../lib/qwen-vision';
import { reconcileAdministrative } from '../lib/administrative-reference';
import { isOnsSourceReplacement } from '../lib/store';
import { STALE_ANALYSIS_MS, recoverStalledTaskList } from '../lib/task-recovery';
import { georeferenceDistrict } from '../lib/georef-agent';
import { buildGeoJson } from '../lib/export';
import type { VisionResult } from '../lib/qwen-vision';
import type { Task } from '../lib/store';

test('rasterise un PDF EPT0 réel avec PDF.js sans pdftoppm', async () => {
  const pages = await pdfPageImages(path.join(process.cwd(), 'croquis', 'EPT0-images', '16.08.05.pdf'));
  assert.ok(pages.length >= 1 && pages.length <= 4);
  assert.deepEqual(pages[0].subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
});

test('récupère seulement les analyses réellement bloquées', () => {
  const now = Date.parse('2026-09-15T14:30:00.000Z');
  const tasks: Task[] = [
    { id: 'stale', fileName: 'old.pdf', sourceFile: 'old.pdf', status: 'running', startedAt: new Date(now - STALE_ANALYSIS_MS - 1).toISOString() },
    { id: 'active', fileName: 'new.pdf', sourceFile: 'new.pdf', status: 'running', startedAt: new Date(now - 5_000).toISOString() },
  ];
  const recovered = recoverStalledTaskList(tasks, now);
  assert.deepEqual(recovered.recovered, ['stale']);
  assert.equal(recovered.tasks[0].status, 'queued');
  assert.equal(recovered.tasks[1].status, 'running');
});

test('ne publie aucune coordonnée sans géoréférencement validé', () => {
  const views = buildGeoreferenceFileViews([{ fileName: '16.08.05.pdf', kind: 'pdf' }], {});
  assert.equal(views[0].georeference.status, 'not_available');
  assert.equal('lat' in views[0], false);
  assert.equal('lng' in views[0], false);
});

test('écarte les libellés non localisants de tous les croquis', () => {
  assert.equal(isGenericGeoreferenceLabel('T 90'), true);
  assert.equal(isGenericGeoreferenceLabel('terrain nu'), true);
  assert.equal(isGenericGeoreferenceLabel('Rue'), true);
  assert.equal(isGenericGeoreferenceLabel('Avenue :'), true);
  assert.equal(isGenericGeoreferenceLabel('Voie'), true);
  assert.equal(isGenericGeoreferenceLabel('Rue des Frères'), false);
  assert.equal(isGenericGeoreferenceLabel('Cité 420 Logements'), false);
});

test('retire les voies sans nom et classe les voies nommées hors des repères', () => {
  const cleaned = sanitizeGeoreferenceEvidence({
    sourceFile: '16.10.19.pdf',
    administrative: { wilaya: 'Alger', commune: 'EL BIAR', districtNumber: '019', scale: '1/1000' },
    landmarks: ['CNAS', 'Rue', 'Rue Dahmouni'],
    streets: ['Avenue', 'Rue des Frères'],
    warnings: [], extractionConfidence: 0.65, model: 'qwen3-vl:30b',
  });
  assert.deepEqual(cleaned.landmarks, ['CNAS']);
  assert.deepEqual(cleaned.streets, ['Rue des Frères', 'Rue Dahmouni']);
});

test('ne répète pas les avertissements du référentiel pendant les relectures', async () => {
  const result = {
    sourceFile: '16.07.019.pdf',
    administrative: { wilaya: "WILAYA D'ALGER", commune: 'CASBAH', districtNumber: 'N° 019', scale: null },
    warnings: ["Référentiel administratif 16.07.019 retenu malgré wilaya Qwen « WILAYA D'ALGER », district Qwen « N° 019 »."],
  };
  const reconciled = await reconcileAdministrative(result);
  assert.equal(reconciled.warnings.filter((warning) => warning.startsWith('Référentiel administratif 16.07.019')).length, 1);
});

test('n’autorise une réanalyse ONS que si les octets de la source ont changé', () => {
  const baseline = { sha256: 'a'.repeat(64), size: 100, modifiedAt: '2026-09-15T00:00:00.000Z' };
  assert.equal(isOnsSourceReplacement(baseline, { ...baseline }), false);
  assert.equal(isOnsSourceReplacement(baseline, { ...baseline, sha256: 'b'.repeat(64) }), true);
  assert.equal(isOnsSourceReplacement(undefined, { ...baseline, sha256: 'b'.repeat(64) }), false);
});

const confirmedVision = (overrides: Partial<VisionResult> = {}): VisionResult => ({
  sourceFile: '16.09.039.pdf',
  administrative: { wilaya: 'Alger', commune: 'BIR MOURAD RAIS', districtNumber: '039', scale: null },
  landmarks: ['École Ali Megherbi', 'O.N.A.T.'], streets: [], warnings: [], extractionConfidence: 0.8, model: 'qwen3-vl:30b',
  administrativeProvenance: { wilaya: 'reference_excel', commune: 'reference_excel', districtNumber: 'reference_excel' },
  ...overrides,
});

test('crée un candidat provisoire à partir de deux preuves Google distinctes convergentes', async () => {
  const result = await georeferenceDistrict(confirmedVision(), async (query) => [{ formatted_address: query, place_id: query, geometry: { location: query.startsWith('École') ? { lat: 36.75, lng: 3.05 } : { lat: 36.7508, lng: 3.0508 } } }]);
  assert.equal(result.status, 'provisional');
  if (result.status !== 'provisional') return;
  assert.equal(result.georeference.evidence.length, 2);
  assert.equal(result.georeference.bestCandidate.location.lat, 36.75);
  assert.ok(result.georeference.maxDistanceMeters < 500);
});

test('refuse les preuves uniques ou non convergentes sans inventer de point', async () => {
  const single = await georeferenceDistrict(confirmedVision({ landmarks: ['École Ali Megherbi'], streets: [] }), async () => []);
  assert.equal(single.status, 'not_eligible');
  const distant = await georeferenceDistrict(confirmedVision(), async (query) => [{ formatted_address: query, geometry: { location: query.startsWith('École') ? { lat: 36.75, lng: 3.05 } : { lat: 36.77, lng: 3.08 } } }]);
  assert.equal(distant.status, 'no_convergence');
  const unconfirmed = await georeferenceDistrict(confirmedVision({ administrativeProvenance: { wilaya: 'qwen_ocr', commune: 'reference_excel', districtNumber: 'reference_excel' } }), async () => []);
  assert.equal(unconfirmed.status, 'not_eligible');
});

test('exporte la réponse Google retenue et jamais un centroïde', async () => {
  const outcome = await georeferenceDistrict(confirmedVision(), async (query) => [{ formatted_address: query, geometry: { location: query.startsWith('École') ? { lat: 36.75, lng: 3.05 } : { lat: 36.7508, lng: 3.0508 } } }]);
  assert.equal(outcome.status, 'provisional');
  if (outcome.status !== 'provisional') return;
  const geojson = buildGeoJson({}, { '16.09.039.pdf': outcome.georeference });
  assert.deepEqual(geojson.features[0].geometry.coordinates, [3.05, 36.75]);
});
