import { readGeoreferences } from '@/lib/georef-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const records = await readGeoreferences();
  const districts = Object.entries(records).map(([fileName, georeference]) => ({
    fileName,
    administrative: georeference.administrative,
    bestCandidate: georeference.bestCandidate,
    evidence: georeference.evidence,
    maxDistanceMeters: georeference.maxDistanceMeters,
    savedAt: georeference.savedAt || null,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${georeference.bestCandidate.location.lat},${georeference.bestCandidate.location.lng}`)}`,
  }));
  return Response.json({ districts });
}
