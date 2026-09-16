import { promises as fs } from 'node:fs';
import path from 'node:path';

const GEOCODE_CACHE_FILE = path.join(process.cwd(), 'data', 'geocode-cache.json');

interface GeocodeCache {
  [query: string]: { results: GeocodeResult[]; timestamp: number };
}

export interface GeocodeResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  place_id?: string;
  types?: string[];
}

/** Places API (New) Text Search, normalized to the same evidence format as Geocoding. */
export async function searchPlaceText(textQuery: string): Promise<GeocodeResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY non configuré');
  const cache = await readCache();
  const cacheKey = `places-new:${textQuery}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 30 * 24 * 60 * 60 * 1000) return cache[cacheKey].results;
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({ textQuery, languageCode: 'fr', regionCode: 'DZ', pageSize: 2 }),
  });
  const data = await response.json().catch(() => ({})) as { places?: Array<{ id?: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude?: number; longitude?: number }; types?: string[] }>; error?: { message?: string } };
  if (!response.ok) throw new Error(`Places API (New) error: ${response.status} - ${data.error?.message || ''}`);
  const results = (data.places || []).flatMap((place) => place.location && Number.isFinite(place.location.latitude) && Number.isFinite(place.location.longitude) ? [{
    formatted_address: place.formattedAddress || place.displayName?.text || textQuery,
    geometry: { location: { lat: place.location.latitude!, lng: place.location.longitude! } },
    place_id: place.id,
    types: place.types,
  }] : []);
  cache[cacheKey] = { results, timestamp: Date.now() };
  await writeCache(cache);
  return results;
}

async function readCache(): Promise<GeocodeCache> {
  try {
    return JSON.parse(await fs.readFile(GEOCODE_CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function writeCache(cache: GeocodeCache) {
  await fs.mkdir(path.dirname(GEOCODE_CACHE_FILE), { recursive: true });
  await fs.writeFile(GEOCODE_CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function geocodeAddress(address: string): Promise<GeocodeResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY non configuré');

  const cache = await readCache();
  const cacheKey = `geocode:${address}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 30 * 24 * 60 * 60 * 1000) {
    return cache[cacheKey].results;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=DZ&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || ''}`);
  }

  const results = data.results || [];
  cache[cacheKey] = { results, timestamp: Date.now() };
  await writeCache(cache);
  return results;
}

export async function placesNearby(
  location: { lat: number; lng: number },
  radius: number,
  type: string,
): Promise<GeocodeResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY non configuré');

  const cacheKey = `places:${location.lat},${location.lng}:${radius}:${type}`;
  const cache = await readCache();
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 7 * 24 * 60 * 60 * 1000) {
    return cache[cacheKey].results;
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status} - ${data.error_message || ''}`);
  }

  const results = data.results || [];
  cache[cacheKey] = { results, timestamp: Date.now() };
  await writeCache(cache);
  return results;
}
