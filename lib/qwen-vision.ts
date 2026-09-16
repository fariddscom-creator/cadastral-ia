import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { safeSourcePath } from './croquis';
import { detectSignature } from './core';
import { reconcileAdministrative, type AdministrativeEvidence, type AdministrativeProvenance } from './administrative-reference';

export type VisionResult = {
  sourceFile: string;
  administrative: { wilaya: string | null; commune: string | null; districtNumber: string | null; scale: string | null };
  streets: string[];
  landmarks: string[];
  warnings: string[];
  extractionConfidence: number;
  model: string;
  administrativeProvenance?: AdministrativeProvenance;
  administrativeEvidence?: AdministrativeEvidence;
};

type OllamaResponse = { message?: { content?: string; thinking?: string; role?: string }; error?: string; done_reason?: string };

const prompt = `/no_think
Tu analyses un croquis cadastral algérien. Réponds UNIQUEMENT avec un JSON compact valide, sans markdown.
Format exact: {"wilaya":string|null,"commune":string|null,"district_number":string|null,"scale":string|null,"landmarks":string[],"streets":string[],"warnings":string[],"confidence":number}.
Le croquis peut comporter plusieurs pages, fournies dans leur ordre : examine-les toutes, car le cartouche administratif et les repères peuvent être sur une page ultérieure. Lis d’abord le cartouche administratif : wilaya et commune doivent reprendre la graphie officielle visible. Extrais ENSUITE les repères nommés, avant les voies : projets, lotissements, cités, ministères, équipements et lieux-dits. Dans landmarks, garde au plus 12 repères nommés et préfère les libellés spécifiques aux mentions génériques (parking, station, centre). Ne mets jamais une rue, une avenue, une route, un boulevard, un chemin ou une impasse dans landmarks : ces éléments vont exclusivement dans streets s'ils ont un nom complet. Exclue les identifiants cadastraux seuls : « Ilot 420 », « Lot 17 », « Parcelle 208 », « Bloc 12 » et les codes techniques du type « T 90 ». Exclue aussi les descriptions non localisantes telles que « terrain nu », « terrain vague », « chantier en cours », « friche » ou « espace libre ». Conserve en revanche les noms composés utiles comme « Cité 420 Logements », « Bloc administratif Sonelgaz » et « Lotissement El Fath ». Dans streets, garde au plus 12 voies avec un vrai nom, utiles au géoréférencement. Exclue systématiquement les libellés incomplets « Rue », « Avenue », « Route », « Boulevard », « Chemin », « Impasse » ou « Voie », même lorsqu'ils sont seuls dans le dessin ; exclue aussi « Rue N°1 », « Rue 08 », « Impasse 4 », toute voie réduite à un numéro, les numéros de district, d’îlot et de parcelle, ainsi que les descriptions de terrain ou de chantier. Une voie n'est conservée que si son nom propre est lisible, par exemple « Rue des Frères » ou « Avenue Mouloud Feraoun ». Ne devine ni coordonnées GPS ni adresses. confidence est entre 0 et 1.`;

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.map(text).filter((item): item is string => Boolean(item)))] : [];
}

export function isGenericGeoreferenceLabel(value: string): boolean {
  const label = value.trim().replace(/[,:;.]$/u, '').trim();
  if (/^\d+(?:[./-]\d+)*$/.test(label)) return true;
  if (/^(?:îlot|ilot|lot|parcelle|bloc|district|secteur|zone)\s*(?:n[°o.]?\s*)?\d+(?:[./-]\d+)*$/i.test(label)) return true;
  if (/^(?:t|bt)\s*(?:n[°o.]?\s*)?\d+(?:[./-]\d+)*$/i.test(label)) return true;
  if (/^(?:terrain(?:\s+(?:nu|vague|vacant|libre))?|chantier(?:\s+en\s+cours)?|friche|espace\s+(?:libre|non\s+b[âa]ti))$/i.test(label)) return true;
  return /^(?:route|rue|avenue|boulevard|chemin|impasse|voie)\s*(?:n[°o.]?\s*)?\d*(?:\s*(?:bis|ter))?$/i.test(label);
}

function isNamedRoad(value: string): boolean {
  return /^(?:route|rue|avenue|boulevard|chemin|impasse|voie)\b/i.test(value)
    && !isGenericGeoreferenceLabel(value);
}

function namedLandmarks(value: unknown): string[] {
  return stringList(value).filter((item) => !isGenericGeoreferenceLabel(item) && !isNamedRoad(item));
}

function normalizeRoadWord(value: string): string {
  // Variante OCR fréquente dans les libellés algériens ; ne modifie pas la preuve
  // quand elle est déjà correcte et rend le nom canonique lisible au dashboard.
  return value.replace(/\bMoulloud\b/gi, 'Mouloud');
}

function namedStreets(value: unknown): string[] {
  const tokens = stringList(value).filter((item) => !isGenericGeoreferenceLabel(item));
  const result: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (/^(route|rue|avenue|boulevard|chemin|impasse)$/i.test(token) && tokens[index + 1] && tokens[index + 2]) {
      result.push(normalizeRoadWord(`${token} ${tokens[index + 1]} ${tokens[index + 2]}`));
      index += 2;
    } else {
      result.push(normalizeRoadWord(token));
    }
  }
  return [...new Set(result)];
}

export function sanitizeGeoreferenceEvidence(result: VisionResult): VisionResult {
  const roadsReportedAsLandmarks = stringList(result.landmarks).filter(isNamedRoad);
  return {
    ...result,
    streets: [...new Set([...namedStreets(result.streets), ...namedStreets(roadsReportedAsLandmarks)])],
    landmarks: namedLandmarks(result.landmarks),
  };
}

function parseJson(content: string): Record<string, unknown> {
  const stripped = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) {
    const excerpt = stripped.replace(/\s+/g, ' ').slice(0, 300);
    throw new Error(`Qwen3-VL n’a pas retourné de JSON exploitable${excerpt ? ` : ${excerpt}` : ''}`);
  }
  try {
    return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error('Qwen3-VL a retourné un JSON invalide');
  }
}

/** Renders up to four PDF pages without depending on Poppler or Ghostscript. */
export async function pdfPageImages(sourcePath: string): Promise<Buffer[]> {
  const [{ getDocument, GlobalWorkerOptions }, { createCanvas }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('@napi-rs/canvas'),
  ]);
  // Turbopack bundles pdf.mjs under .next but not its dynamically imported fake
  // worker.  A file URL bypasses that bundle-relative lookup in the Node runtime.
  GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(
    process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs',
  )).href;
  const document = await getDocument({
    data: new Uint8Array(await fs.readFile(sourcePath)),
    standardFontDataUrl: pathToFileURL(`${path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts')}${path.sep}`).href,
  }).promise;
  try {
    const pages: Buffer[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(4, document.numPages); pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 4096 / Math.max(baseViewport.width, baseViewport.height));
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const canvasContext = canvas.getContext('2d');
      const renderContext = { canvas, canvasContext, viewport } as unknown as Parameters<typeof page.render>[0];
      await page.render(renderContext).promise;
      pages.push(canvas.toBuffer('image/png'));
    }
    if (!pages.length) throw new Error('Le PDF ne contient aucune page rendable');
    return pages;
  } finally {
    await document.cleanup();
  }
}

async function rasterBase64(bytes: Buffer): Promise<string> {
  const sharp = (await import('sharp')).default;
  let raster = sharp(bytes, { page: 0 });
  const metadata = await raster.metadata();
  // Les exports EPT0 en planche 2×2 répètent le même croquis selon quatre
  // orientations. La vue en haut à gauche contient le cartouche à l’endroit.
  if (metadata.width && metadata.height && metadata.width === metadata.height && metadata.width >= 3000) {
    const side = Math.floor(metadata.width / 2);
    raster = raster.extract({ left: 0, top: 0, width: side, height: side });
  }
  return (await raster
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 86 })
    .toBuffer()).toString('base64');
}

async function imageBase64s(sourcePath: string): Promise<string[]> {
  const sourceBytes = await fs.readFile(sourcePath);
  const kind = detectSignature(sourceBytes.subarray(0, 16));
  if (kind === 'pdf') return Promise.all((await pdfPageImages(sourcePath)).map(rasterBase64));
  if (kind === 'png' || kind === 'jpeg' || kind === 'tiff') return [await rasterBase64(sourceBytes)];
  throw new Error('Qwen3-VL accepte ici les croquis PDF, PNG, JPEG ou TIFF');
}

export async function runQwenVision(fileName: string): Promise<VisionResult> {
  const sourcePath = await safeSourcePath(fileName);
  if (!sourcePath) throw new Error('Fichier croquis introuvable ou non autorisé');

  const model = process.env.QWEN_VISION_MODEL?.trim() || 'qwen3-vl:30b';
  const baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Le format JSON simple est supporté par le moteur Qwen3-VL local ; on évite
    // volontairement un schéma JSON riche, trop fragile selon les versions Ollama.
    body: JSON.stringify({ model, stream: false, format: 'json', think: false, options: { temperature: 0.1, num_predict: 1000 }, messages: [{ role: 'user', content: prompt, images: await imageBase64s(sourcePath) }] }),
    signal: AbortSignal.timeout(600_000),
  });
  const body = await response.json().catch(() => ({})) as OllamaResponse;
  if (!response.ok) throw new Error(body.error || `Ollama a répondu ${response.status}`);
  const modelContent = body.message?.content || body.message?.thinking || '';
  if (!modelContent.trim()) {
    throw new Error(`Qwen3-VL a retourné une réponse vide (${JSON.stringify(body).slice(0, 280)})`);
  }
  const parsed = parseJson(modelContent);
  const confidence = typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0;
  const rawResult: VisionResult = {
    sourceFile: path.basename(fileName),
    administrative: { wilaya: text(parsed.wilaya), commune: text(parsed.commune), districtNumber: text(parsed.district_number), scale: text(parsed.scale) },
    streets: namedStreets(parsed.streets),
    landmarks: namedLandmarks(parsed.landmarks),
    warnings: stringList(parsed.warnings),
    extractionConfidence: confidence,
    model,
  };
  return reconcileAdministrative(sanitizeGeoreferenceEvidence(rawResult));
}
