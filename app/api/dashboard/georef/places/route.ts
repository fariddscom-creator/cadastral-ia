import { geocodeAddress, searchPlaceText } from '@/lib/google-geocode';
import { readGeoreferences } from '@/lib/georef-store';
import { isGenericGeoreferenceLabel } from '@/lib/qwen-vision';
import { readTasks } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PlaceMarker = { evidence: string; kind: 'landmark' | 'street'; source: 'places_new' | 'geocoding'; address: string; placeId: string | null; location: { lat: number; lng: number } };

function uniqueEvidence(items: Array<{ evidence: string; kind: 'landmark' | 'street' }>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.evidence.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('fr');
    if (!key || seen.has(key) || isGenericGeoreferenceLabel(item.evidence)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  const fileName = new URL(request.url).searchParams.get('fileName');
  if (!fileName) return Response.json({ error: 'fileName requis' }, { status: 400 });
  const [records, tasks] = await Promise.all([readGeoreferences(), readTasks()]);
  const georeference = records[fileName];
  const task = tasks.find((candidate) => candidate.fileName === fileName);
  if (!georeference || !task?.result) return Response.json({ error: 'District provisoire introuvable.' }, { status: 404 });
  const administrative = task.result.administrative;
  const evidence = uniqueEvidence([
    ...task.result.landmarks.map((value) => ({ evidence: value, kind: 'landmark' as const })),
    ...task.result.streets.map((value) => ({ evidence: value, kind: 'street' as const })),
  ]);
  const markers: PlaceMarker[] = [];
  for (const item of evidence) {
    const query = `${item.evidence}, ${administrative.commune}, ${administrative.wilaya}, Algérie`;
    let matches = await searchPlaceText(query);
    let source: PlaceMarker['source'] = 'places_new';
    if (!matches.length) { matches = await geocodeAddress(query); source = 'geocoding'; }
    const match = matches[0];
    if (match) markers.push({ evidence: item.evidence, kind: item.kind, source, address: match.formatted_address, placeId: match.place_id || null, location: match.geometry.location });
  }
  return Response.json({ fileName, searched: evidence.length, markers, missing: evidence.filter((item) => !markers.some((marker) => marker.evidence === item.evidence)).map((item) => item.evidence) });
}
