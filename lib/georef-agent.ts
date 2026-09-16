import { geocodeAddress, type GeocodeResult } from './google-geocode';
import { isGenericGeoreferenceLabel, type VisionResult } from './qwen-vision';
import type { StoredGeoreference, StoredGeoreferenceEvidence } from './export';

export const MAX_GEOREFERENCE_EVIDENCE = 8;
export const CONVERGENCE_DISTANCE_METERS = 500;
export type GeocodeLookup = (query: string) => Promise<GeocodeResult[]>;

export type GeoreferenceOutcome =
  | { status: 'provisional'; georeference: StoredGeoreference; searchedEvidence: string[] }
  | { status: 'not_eligible' | 'no_convergence'; reason: string; searchedEvidence: string[] };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('fr');
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function namedEvidence(result: VisionResult) {
  const unique = new Map<string, string>();
  for (const value of [...result.landmarks, ...result.streets]) {
    const clean = value.trim();
    if (!clean || isGenericGeoreferenceLabel(clean)) continue;
    unique.set(normalize(clean), clean);
  }
  return [...unique.values()].slice(0, MAX_GEOREFERENCE_EVIDENCE);
}

function isAdministrativelyConfirmed(result: VisionResult) {
  const provenance = result.administrativeProvenance;
  return provenance?.wilaya === 'reference_excel'
    && provenance.commune === 'reference_excel'
    && provenance.districtNumber === 'reference_excel'
    && Boolean(result.administrative.wilaya && result.administrative.commune && result.administrative.districtNumber);
}

function evidenceFromGoogle(evidence: string, query: string, result: GeocodeResult): StoredGeoreferenceEvidence {
  return { evidence, query, address: result.formatted_address, placeId: result.place_id || null, location: result.geometry.location };
}

/** A retained coordinate always comes from a stored Google response, never a centroid. */
export async function georeferenceDistrict(result: VisionResult, lookup: GeocodeLookup = geocodeAddress): Promise<GeoreferenceOutcome> {
  if (!isAdministrativelyConfirmed(result)) return { status: 'not_eligible', reason: 'Administratif non confirmé par le référentiel local.', searchedEvidence: [] };
  const evidence = namedEvidence(result);
  if (evidence.length < 2) return { status: 'not_eligible', reason: 'Au moins deux repères ou voies nommés distincts sont requis.', searchedEvidence: evidence };

  const locationEvidence: StoredGeoreferenceEvidence[] = [];
  for (const item of evidence) {
    const query = `${item}, ${result.administrative.commune}, ${result.administrative.wilaya}, Algérie`;
    for (const match of (await lookup(query)).slice(0, 2)) locationEvidence.push(evidenceFromGoogle(item, query, match));
  }

  let selected: [StoredGeoreferenceEvidence, StoredGeoreferenceEvidence, number] | null = null;
  for (let left = 0; left < locationEvidence.length; left += 1) for (let right = left + 1; right < locationEvidence.length; right += 1) {
    const first = locationEvidence[left]; const second = locationEvidence[right];
    if (normalize(first.evidence) === normalize(second.evidence)) continue;
    const distance = distanceMeters(first.location, second.location);
    if (distance <= CONVERGENCE_DISTANCE_METERS && (!selected || distance < selected[2])) selected = [first, second, distance];
  }
  if (!selected) return { status: 'no_convergence', reason: `Aucune paire de preuves distinctes ne converge dans ${CONVERGENCE_DISTANCE_METERS} m.`, searchedEvidence: evidence };

  const [bestCandidate, corroboratingCandidate, maxDistanceMeters] = selected;
  return {
    status: 'provisional', searchedEvidence: evidence,
    georeference: { status: 'provisional', administrative: result.administrative, bestCandidate, evidence: [bestCandidate, corroboratingCandidate], maxDistanceMeters: Math.round(maxDistanceMeters), model: result.model },
  };
}
