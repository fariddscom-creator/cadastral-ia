export type StoredGeoreferenceEvidence = {
  evidence: string;
  query: string;
  address: string;
  placeId: string | null;
  location: { lat: number; lng: number };
};

export type StoredGeoreference = {
  status: 'provisional';
  administrative: { wilaya: string | null; commune: string | null; districtNumber: string | null; scale: string | null };
  bestCandidate: StoredGeoreferenceEvidence;
  evidence: StoredGeoreferenceEvidence[];
  maxDistanceMeters: number;
  model: string;
  savedAt?: string;
};

export type ExtractionResult = { administrative?: Record<string, string | null>; extraction_confidence?: number };
export type GeoJsonFeatureCollection = { type: 'FeatureCollection'; features: Array<{ type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: Record<string, string | number | null> }> };

/** Exports only an exact, stored provisional Google response. */
export function buildGeoJson(results: Record<string, ExtractionResult>, georeferences: Record<string, StoredGeoreference>): GeoJsonFeatureCollection {
  return { type: 'FeatureCollection', features: Object.entries(georeferences).map(([sourceFile, georeference]) => {
    const administrative = (results[sourceFile]?.administrative || georeference.administrative) as Record<string, string | null>;
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [georeference.bestCandidate.location.lng, georeference.bestCandidate.location.lat] },
      properties: { source_file: sourceFile, wilaya: administrative.wilaya || null, commune: administrative.commune || null, district_number: administrative.districtNumber || administrative.district_number || null, status: georeference.status, evidence_count: georeference.evidence.length, max_distance_meters: georeference.maxDistanceMeters },
    };
  }) };
}

const xmlEscape = (value: unknown) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export function buildKml(collection: GeoJsonFeatureCollection) {
  const placemarks = collection.features.map((feature) => `<Placemark><name>${xmlEscape(feature.properties.source_file)}</name><description>${xmlEscape(`Provisoire — ${feature.properties.evidence_count} preuves`)}</description><Point><coordinates>${feature.geometry.coordinates[0]},${feature.geometry.coordinates[1]},0</coordinates></Point></Placemark>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Districts provisoires</name>${placemarks}</Document></kml>`;
}
