import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { detectSignature, type FileKind } from './core';
import { safeSourcePath } from './croquis';
import { extractPdfEvidence, mergePdfEvidence, type PdfEvidence } from './pdf-evidence';
import type { Task } from './store';

const nullableString = { type: ['string', 'null'] } as const;
const coordinatePair = {
  type: 'array',
  items: { type: 'number', minimum: 0, maximum: 1000 },
  minItems: 2,
  maxItems: 2,
} as const;
const bboxArray = {
  type: 'array',
  items: { type: 'number', minimum: 0, maximum: 1000 },
  minItems: 4,
  maxItems: 4,
} as const;

export const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'source_file',
    'administrative',
    'streets',
    'landmarks',
    'icons',
    'legends',
    'north_arrow_degrees',
    'district_boundary',
    'extraction_confidence',
    'warnings',
  ],
  properties: {
    source_file: { type: 'string' },
    administrative: {
      type: 'object',
      additionalProperties: false,
      required: ['wilaya', 'daira_or_ca', 'commune', 'district_number', 'scale'],
      properties: {
        wilaya: nullableString,
        daira_or_ca: nullableString,
        commune: nullableString,
        district_number: nullableString,
        scale: nullableString,
      },
    },
    streets: { type: 'array', items: { type: 'string' } },
    landmarks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name', 'pixel', 'confidence', 'evidence'],
        properties: {
          type: { type: 'string' },
          name: nullableString,
          pixel: { anyOf: [coordinatePair, { type: 'null' }] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidence: { type: 'string' },
        },
      },
    },
    icons: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name', 'pixel', 'confidence', 'legend'],
        properties: {
          type: {
            type: 'string',
            enum: ['mosque', 'school', 'administration', 'hospital', 'cemetery', 'market', 'stadium', 'other'],
          },
          name: nullableString,
          pixel: bboxArray,
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          legend: { type: 'string' },
        },
      },
    },
    legends: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'pixel', 'type'],
        properties: {
          text: { type: 'string' },
          pixel: coordinatePair,
          type: { type: 'string', enum: ['district_number', 'scale', 'north_arrow', 'title_block', 'other'] },
        },
      },
    },
    north_arrow_degrees: { type: ['number', 'null'], minimum: 0, maximum: 360 },
    district_boundary: { type: 'array', items: coordinatePair },
    extraction_confidence: { type: 'number', minimum: 0, maximum: 1 },
    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const;

export function extractionPrompt(fileName: string, pdfEvidence: PdfEvidence[] = []) {
  const evidenceBlock = pdfEvidence.length
    ? `\nCOUCHE TEXTE PDF POSITIONNÉE (preuve documentaire forte, coordonnées normalisées 0–1000):\n${JSON.stringify(pdfEvidence)}\nUtilise exhaustivement les libellés propres de cette couche: chaque élément kind=street doit être repris dans streets et chaque kind=landmark dans landmarks avec son pixel. Ignore seulement les chaînes manifestement corrompues. Vérifie visuellement les contradictions.`
    : '';
  return `Analyse le croquis cadastral algérien joint et retourne uniquement le JSON conforme au schéma fourni.
Fichier source exact: ${JSON.stringify(fileName)}.
Extrais séparément wilaya, C.A./daïra, commune, numéro du district et échelle. Conserve les graphies visibles.
Liste exhaustivement les rues et les repères nommés (stade, ambassade, école, mosquée, cité, cimetière, équipement ou autre) lorsqu'ils sont lisibles visuellement ou présents proprement dans la couche texte PDF.

**DÉTECTION D'ICÔNES/SYMBOLES (NOUVEAU)** :
Détecte tous les symboles/icônes visibles sur le croquis et retourne-les dans le champ "icons" :
- mosquée (croissant, minaret, dôme, libellé "mosquée" ou "msjd")
- école (bâtiment avec libellé "école", "écol", "ecole", "lycée", "collège")
- administration (bâtiment officiel, mairie, APC, préfecture, daïra, wilaya, "administration")
- hôpital / clinique (croix, libellé "hôpital", "clinique", "hopital", "dispensaire")
- cimetière (libellé "cimetière", "cimetiere", symboles de tombes)
- marché (libellé "marché", "marche", "souk")
- stade / terrain de sport (libellé "stade", "terrain", "sport")
- autre (tout repère visuel significatif non classé ci-dessus)

Pour CHAQUE icône détectée, fournis :
- type: l'une des valeurs ci-dessus
- nom: le texte lu à côté du symbole (ou null si illisible)
- pixel: bbox [x, y, width, height] en coordonnées normalisées 0-1000
- confidence: 0.0 à 1.0
- legend: texte de légende adjacent (numéro, nom, description)

**LÉGENDES ET INFORMATIONS MARGINALES** :
Extrais toutes les légendes, cartouches et annotations marginales dans le champ "legends" :
- district_number: numéro de district (ex: "District 05", "N° 05", "05")
- scale: échelle (ex: "1:1000", "Échelle 1/2000")
- north_arrow: flèche nord (orientation en degrés si lisible)
- title_block: cartouche titre (wilaya, commune, date, auteur)
- other: toute autre annotation

Pour CHAQUE légende, fournis :
- text: texte exact lu
- pixel: position [x, y] normalisée 0-1000
- type: l'une des valeurs ci-dessus

Les positions pixel et district_boundary utilisent des coordonnées [x,y] normalisées de 0 à 1000 dans l'image rendue.
Trace district_boundary autour de la limite extérieure réelle du district indiqué par l'en-tête. Ne prends jamais le cadre de la page, la légende, les limites d'îlots ou un rectangle d'image pour cette limite.
Retourne district_boundary=[] si la limite est partielle, ambiguë ou insuffisamment visible. N'invente aucune valeur, aucun nom et aucune coordonnée géographique. Signale toute contradiction dans warnings.${evidenceBlock}`;
}

export function buildCodexArgs(imagePath: string, schemaPath: string, outputPath: string, model?: string) {
  const args = ['exec', '--ephemeral'];
  if (model) args.push('--model', model);
  args.push('--output-schema', schemaPath, '--output-last-message', outputPath, '--image', imagePath, '-');
  return args;
}

async function run(command: string, args: string[], stdin?: string) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(command, args, { windowsHide: true });
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} a échoué (${code}): ${stderr.slice(-1200)}`));
    });
    if (stdin !== undefined) child.stdin.end(stdin);
  });
}

async function sourceKind(sourcePath: string): Promise<FileKind> {
  const handle = await fs.open(sourcePath, 'r');
  try {
    const header = Buffer.alloc(16);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return detectSignature(header.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

async function prepareImage(sourcePath: string, kind: FileKind, tempDir: string) {
  const imagePath = path.join(tempDir, 'source.png');
  if (kind === 'jpeg' || kind === 'png') {
    const ext = kind === 'jpeg' ? 'jpg' : 'png';
    const imgPath = path.join(tempDir, `source.${ext}`);
    await fs.copyFile(sourcePath, imgPath);
    return imgPath;
  }
  if (kind === 'pdf') {
    const [{ getDocument }, { createCanvas }] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('@napi-rs/canvas'),
    ]);
    const bytes = new Uint8Array(await fs.readFile(sourcePath));
    const document = await getDocument({
      data: bytes,
      standardFontDataUrl: pathToFileURL(`${path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts')}${path.sep}`).href,
    }).promise;
    try {
      const page = await document.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 4096 / Math.max(baseViewport.width, baseViewport.height));
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const canvasContext = canvas.getContext('2d');
      const renderContext = { canvasContext, viewport } as unknown as Parameters<typeof page.render>[0];
      await page.render(renderContext).promise;
      await fs.writeFile(imagePath, canvas.toBuffer('image/png'));
    } finally {
      await document.cleanup();
    }
    return imagePath;
  }
  if (kind === 'tiff') {
    const sharp = (await import('sharp')).default;
    await sharp(sourcePath, { page: 0 }).png().toFile(imagePath);
    return imagePath;
  }
  throw new Error(kind === 'all-zero'
    ? 'Fichier rempli de zéros, indisponible ou non synchronisé'
    : 'Signature de fichier non prise en charge ou corrompue');
}

type Extraction = {
  source_file: string;
  administrative: Record<string, string | null>;
  streets: string[];
  landmarks: Array<{
    type: string;
    name: string | null;
    pixel: [number, number] | null;
    confidence: number;
    evidence: string;
  }>;
  icons: Array<{
    type: 'mosque' | 'school' | 'administration' | 'hospital' | 'cemetery' | 'market' | 'stadium' | 'other';
    name: string | null;
    pixel: [number, number, number, number];
    confidence: number;
    legend: string;
  }>;
  legends: Array<{
    text: string;
    pixel: [number, number];
    type: 'district_number' | 'scale' | 'north_arrow' | 'title_block' | 'other';
  }>;
  north_arrow_degrees: number | null;
  district_boundary: [number, number][];
  extraction_confidence: number;
  warnings: string[];
};

function validateExtraction(value: unknown, expectedFile: string): asserts value is Extraction {
  if (!value || typeof value !== 'object') throw new Error('JSON Codex non conforme');
  const extraction = value as Partial<Extraction>;
  if (
    extraction.source_file !== expectedFile ||
    !extraction.administrative ||
    !Array.isArray(extraction.streets) ||
    !Array.isArray(extraction.landmarks) ||
    !Array.isArray(extraction.icons) ||
    !Array.isArray(extraction.legends) ||
    !Array.isArray(extraction.district_boundary) ||
    typeof extraction.extraction_confidence !== 'number' ||
    !Array.isArray(extraction.warnings)
  ) throw new Error('JSON Codex non conforme au contrat cadastral étendu');
}

export async function runTask(task: Task): Promise<Record<string, unknown>> {
  const fileName = task.fileName || task.sourceFile;
  if (!fileName) throw new Error('Nom de fichier source manquant');
  const sourcePath = await safeSourcePath(fileName);
  if (!sourcePath) throw new Error('Source introuvable ou non sûre');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cadastre-codex-'));
  try {
    const kind = await sourceKind(sourcePath);
    const pdfEvidence = kind === 'pdf' ? await extractPdfEvidence(sourcePath) : [];
    const imagePath = await prepareImage(sourcePath, kind, tempDir);
    const schemaPath = path.join(tempDir, 'schema.json');
    const outputPath = path.join(tempDir, 'result.json');
    await fs.writeFile(schemaPath, JSON.stringify(EXTRACTION_SCHEMA));

    const model = process.env.CODEX_MODEL?.trim() || undefined;
    if (model && !/^[A-Za-z0-9._:/-]+$/.test(model)) throw new Error('CODEX_MODEL contient des caractères invalides');
    const codexCommand = process.env.CODEX_CLI || (process.platform === 'win32' ? 'codex.exe' : 'codex');
    await run(codexCommand, buildCodexArgs(imagePath, schemaPath, outputPath, model), extractionPrompt(fileName, pdfEvidence));

    const parsed: unknown = JSON.parse(await fs.readFile(outputPath, 'utf8'));
    validateExtraction(parsed, fileName);
    const merged = pdfEvidence.length ? mergePdfEvidence(parsed, pdfEvidence) : parsed;
    return merged as unknown as Record<string, unknown>;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
