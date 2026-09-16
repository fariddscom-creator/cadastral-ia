import administrativeReferenceData from '@/data/administrative-reference.json';
import { wilayaNameFromCode } from './wilaya-reference';

export type AdministrativeValues = { wilaya: string | null; commune: string | null; districtNumber: string | null; scale: string | null };
export type AdministrativeProvenance = { wilaya: 'reference_excel' | 'filename' | 'qwen_ocr' | 'missing'; commune: 'reference_excel' | 'qwen_ocr' | 'missing'; districtNumber: 'reference_excel' | 'filename' | 'qwen_ocr' | 'missing' };
export type AdministrativeEvidence = { qwen: AdministrativeValues; reference?: { code: string; workbook: string } };

type FilenameCodes = { wilaya: string; commune: string; district: string };
type Reference = { code: string; wilaya: string; commune: string; districtNumber: string };
type ReconcilableResult = { sourceFile: string; administrative: AdministrativeValues; warnings: string[]; administrativeEvidence?: AdministrativeEvidence };

export function filenameCodes(fileName: string): FilenameCodes | null {
  const match = fileName.match(/^(\d{1,2})\.(\d{1,2})\.\s*(\d{1,3})(?:\D|$)/);
  if (!match) return null;
  return { wilaya: match[1].padStart(2, '0'), commune: match[2].padStart(2, '0'), district: match[3].padStart(3, '0') };
}

function referenceKey(codes: FilenameCodes) {
  return `${codes.wilaya}.${codes.commune}.${codes.district}`;
}

export async function administrativeReference(fileName: string): Promise<Reference | null> {
  const codes = filenameCodes(fileName);
  if (!codes) return null;
  const code = referenceKey(codes);
  const exact = administrativeReferenceData.districts[code as keyof typeof administrativeReferenceData.districts];
  const wilaya = wilayaNameFromCode(codes.wilaya);
  if (exact && wilaya) return { code, wilaya, commune: exact.commune, districtNumber: codes.district };
  return wilaya ? { code, wilaya, commune: '', districtNumber: codes.district } : null;
}

export async function reconcileAdministrative<T extends ReconcilableResult>(result: T): Promise<T & { administrativeProvenance: AdministrativeProvenance; administrativeEvidence: AdministrativeEvidence }> {
  const qwen = result.administrativeEvidence?.qwen || result.administrative;
  const reference = await administrativeReference(result.sourceFile);
  if (!reference) {
    return { ...result, administrativeProvenance: { wilaya: qwen.wilaya ? 'qwen_ocr' : 'missing', commune: qwen.commune ? 'qwen_ocr' : 'missing', districtNumber: qwen.districtNumber ? 'qwen_ocr' : 'missing' }, administrativeEvidence: { qwen } };
  }
  const administrative: AdministrativeValues = {
    wilaya: reference.wilaya,
    commune: reference.commune || qwen.commune,
    districtNumber: reference.districtNumber,
    scale: qwen.scale,
  };
  const provenance: AdministrativeProvenance = {
    wilaya: reference.code ? 'reference_excel' : 'filename',
    commune: reference.commune ? 'reference_excel' : qwen.commune ? 'qwen_ocr' : 'missing',
    districtNumber: reference.code ? 'reference_excel' : 'filename',
  };
  const warnings = result.warnings.filter((warning) => !warning.startsWith('Wilaya déduite du préfixe'));
  const differences = [
    qwen.wilaya && qwen.wilaya.toLocaleLowerCase() !== administrative.wilaya?.toLocaleLowerCase() ? `wilaya Qwen « ${qwen.wilaya} »` : null,
    qwen.commune && qwen.commune.toLocaleLowerCase() !== administrative.commune?.toLocaleLowerCase() ? `commune Qwen « ${qwen.commune} »` : null,
    qwen.districtNumber && qwen.districtNumber !== administrative.districtNumber ? `district Qwen « ${qwen.districtNumber} »` : null,
  ].filter((value): value is string => Boolean(value));
  if (differences.length) warnings.push(`Référentiel administratif ${reference.code} retenu malgré ${differences.join(', ')}.`);
  return { ...result, administrative, warnings: [...new Set(warnings)], administrativeProvenance: provenance, administrativeEvidence: { qwen, reference: { code: reference.code, workbook: 'grappes_echantillon.xlsx' } } };
}
