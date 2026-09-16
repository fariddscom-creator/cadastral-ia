import { runQwenVision } from './qwen-vision';

export type VisionExtractionResult = {
  source_file: string;
  administrative: { wilaya: string; daira_or_ca: string; commune: string; district_number: string; scale: string };
  streets: string[];
  landmarks: Array<{ type: string; name: string; pixel: [number, number] | null; confidence: number; evidence: string }>;
  icons: Array<{ type: 'mosque' | 'school' | 'administration' | 'hospital' | 'cemetery' | 'market' | 'stadium' | 'other'; name: string | null; pixel: [number, number, number, number]; confidence: number; legend: string }>;
  legends: Array<{ text: string; pixel: [number, number]; type: 'district_number' | 'scale' | 'north_arrow' | 'title_block' | 'other' }>;
  district_boundary: [number, number][];
  north_arrow_degrees: number | null;
  extraction_confidence: number;
  warnings: string[];
};

export async function runVisionExtraction(fileName: string): Promise<VisionExtractionResult> {
  const result = await runQwenVision(fileName);
  return {
    source_file: result.sourceFile,
    administrative: {
      wilaya: result.administrative.wilaya || '',
      daira_or_ca: '',
      commune: result.administrative.commune || '',
      district_number: result.administrative.districtNumber || '',
      scale: result.administrative.scale || '',
    },
    streets: result.streets,
    landmarks: result.landmarks.map((name) => ({ type: 'landmark', name, pixel: null, confidence: result.extractionConfidence, evidence: 'Qwen3-VL OCR' })),
    icons: [],
    legends: [],
    district_boundary: [],
    north_arrow_degrees: null,
    extraction_confidence: result.extractionConfidence,
    warnings: result.warnings,
  };
}
