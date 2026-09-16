import type { VisionExtractionResult } from '../../../lib/vision-agent';

/**
 * Service d'extraction unifié Vision + Géoréférencement
 */

export type ExtractionResult = VisionExtractionResult & {
  georef?: never;
};

export async function extractAndGeoreference(_fileName: string): Promise<ExtractionResult> {
  throw new Error('Le géoréférencement se lance manuellement via POST /api/dashboard/georef après une analyse Vision terminée.');
}

export function formatIconType(type: string): string {
  const typeMap: Record<string, string> = {
    mosque: '🕌 Mosquée',
    school: '🏫 École',
    administration: '🏛️ Administration',
    hospital: '🏥 Hôpital',
    cemetery: '⚰️ Cimetière',
    market: '🛒 Marché',
    stadium: '⚽ Stade',
    other: '▫️ Autre',
  };
  return typeMap[type] || type || '';
}

export function formatLegend(legend: any): string {
  return [
    `[#District ${legend.number}]`,
    legend.text,
    legend.type === 'district_number' ? `Numéro district: ${legend.value}` : '',
    legend.type === 'scale' ? `Échelle: ${legend.value}` : '',
    legend.type === 'north_arrow' ? `Nord: ${legend.degrees}°` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
