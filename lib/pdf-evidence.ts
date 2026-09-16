import { readFile } from 'node:fs/promises';

export type PdfTextItem = { text: string; x: number; y: number };
export type PdfEvidence = {
  text: string;
  kind: 'landmark' | 'street' | 'metadata';
  pixel: [number, number];
};

const landmarkPattern = /\b(stade|ambassade|consulat|école|ecole|cem|lycée|lycee|mosquée|mosquee|hôtel|hotel|jardin|clinique|hôpital|hopital|commissariat|poste|marché|marche|musée|musee|ministère|ministere|direction|centre|salle|tribunal|église|eglise|biblioth|apc|siège|siege|croissant|parc|cimetière|cimetiere|université|universite|mairie)\b/i;
const streetPattern = /^(rue|avenue|boulevard|chemin|place|route|quai|impasse|cité|cite|pl\.?)(\s|$)/i;
const metadataPattern = /\b(wilaya|commune|circonscription|daïra|daira|district|échelle|echelle|nom de l.?a\.?c\.?l)\b/i;

function cleanText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function readable(text: string) {
  if (text.length < 3 || text.length > 220) return false;
  const accepted = [...text].filter((character) => /[\p{L}\p{N}\s'’.,()\-/:]/u.test(character)).length;
  return accepted / text.length >= 0.72;
}

export function selectPdfEvidence(items: PdfTextItem[], width: number, height: number): PdfEvidence[] {
  if (!(width > 0) || !(height > 0)) return [];
  const selected: PdfEvidence[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const text = cleanText(item.text);
    if (!readable(text)) continue;
    const kind = landmarkPattern.test(text)
      ? 'landmark'
      : streetPattern.test(text)
        ? 'street'
        : metadataPattern.test(text)
          ? 'metadata'
          : null;
    if (!kind) continue;
    const pixel: [number, number] = [
      Math.max(0, Math.min(1000, Math.round(item.x / width * 1000))),
      Math.max(0, Math.min(1000, Math.round((height - item.y) / height * 1000))),
    ];
    const key = `${kind}:${text.toLocaleLowerCase()}:${pixel.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push({ text, kind, pixel });
  }
  return selected.slice(0, 1200);
}

type MergeableExtraction = {
  streets: string[];
  landmarks: Array<{
    type: string;
    name: string | null;
    pixel: [number, number] | null;
    confidence: number;
    evidence: string;
  }>;
  icons: Array<{
    type: string;
    name: string | null;
    pixel: [number, number, number, number];
    confidence: number;
    legend: string;
  }>;
  legends: Array<{
    text: string;
    pixel: [number, number];
    type: string;
  }>;
  warnings: string[];
};

function landmarkType(text: string) {
  const match = text.match(landmarkPattern)?.[1];
  return match ? match.toLocaleLowerCase() : 'repère';
}

export function mergePdfEvidence<T extends MergeableExtraction>(
  extraction: T,
  evidence: PdfEvidence[],
): Omit<T, 'streets' | 'landmarks' | 'icons' | 'legends' | 'warnings'> & MergeableExtraction {
  const streets = [...extraction.streets];
  const landmarks = [...extraction.landmarks];
  const icons = [...extraction.icons];
  const legends = [...extraction.legends];
  const streetNames = new Set(streets.map((name) => name.toLocaleLowerCase()));
  const landmarkNames = new Set(landmarks.map((landmark) => landmark.name?.toLocaleLowerCase()).filter(Boolean));
  const iconNames = new Set(icons.map((icon) => icon.name?.toLocaleLowerCase()).filter(Boolean));
  const legendTexts = new Set(legends.map((legend) => legend.text.toLocaleLowerCase()));
  let additions = 0;

  for (const item of evidence) {
    const normalized = item.text.toLocaleLowerCase();
    if (item.kind === 'street' && !streetNames.has(normalized)) {
      streets.push(item.text);
      streetNames.add(normalized);
      additions += 1;
    }
    if (item.kind === 'landmark' && !landmarkNames.has(normalized)) {
      landmarks.push({
        type: landmarkType(item.text),
        name: item.text,
        pixel: item.pixel,
        confidence: 0.98,
        evidence: 'Libellé exact de la couche texte PDF, positionné sur la page.',
      });
      landmarkNames.add(normalized);
      additions += 1;
    }
    if (item.kind === 'metadata' && !legendTexts.has(normalized)) {
      let type: 'district_number' | 'scale' | 'north_arrow' | 'title_block' | 'other' = 'other';
      if (/district|n°|numéro/i.test(item.text)) type = 'district_number';
      else if (/échelle|echelle|1[:/]\d+/i.test(item.text)) type = 'scale';
      else if (/nord|north|flèche|fleche/i.test(item.text)) type = 'north_arrow';
      else if (/wilaya|commune|date|auteur|cartouche/i.test(item.text)) type = 'title_block';
      legends.push({ text: item.text, pixel: item.pixel, type });
      legendTexts.add(normalized);
      additions += 1;
    }
  }

  const warning = 'Rues, repères et légendes complétés depuis la couche texte positionnée du PDF.';
  return {
    ...extraction,
    streets,
    landmarks,
    icons,
    legends,
    warnings: additions && !extraction.warnings.includes(warning)
      ? [...extraction.warnings, warning]
      : extraction.warnings,
  };
}

export async function extractPdfEvidence(sourcePath: string) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await getDocument({ data: new Uint8Array(await readFile(sourcePath)) }).promise;
  try {
    const page = await document.getPage(1);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } =>
        'str' in item && Boolean(item.str.trim()))
      .map((item) => ({ text: item.str, x: item.transform[4], y: item.transform[5] }));
    return selectPdfEvidence(items, page.view[2], page.view[3]);
  } finally {
    await document.cleanup();
  }
}