'use client';

import { APIProvider, Circle, InfoWindow, Map, Marker } from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useState } from 'react';

type District = {
  fileName: string;
  administrative: { wilaya: string | null; commune: string | null; districtNumber: string | null };
  bestCandidate: { address: string; location: { lat: number; lng: number } };
  evidence: Array<{ evidence: string; address: string; location: { lat: number; lng: number } }>;
  maxDistanceMeters: number;
  mapUrl: string;
};

type PlaceMarker = { evidence: string; kind: 'landmark' | 'street'; source: 'places_new' | 'geocoding'; address: string; placeId: string | null; location: { lat: number; lng: number } };

export default function GeorefMapClient({ apiKey }: { apiKey: string }) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selected, setSelected] = useState<District | null>(null);
  const [placeMarkers, setPlaceMarkers] = useState<PlaceMarker[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<PlaceMarker | null>(null);
  const [placesState, setPlacesState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [placesError, setPlacesError] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/georef/map', { cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error('Impossible de charger les candidats provisoires.'); return response.json() as Promise<{ districts: District[] }>; })
      .then((payload) => { setDistricts(payload.districts); setState('ready'); })
      .catch((reason: unknown) => { setError(reason instanceof Error ? reason.message : 'Erreur de chargement.'); setState('error'); });
  }, []);

  const selectDistrict = async (district: District) => {
    setSelected(district); setSelectedEvidence(null); setPlaceMarkers([]); setPlacesError(''); setPlacesState('loading');
    try {
      const response = await fetch(`/api/dashboard/georef/places?fileName=${encodeURIComponent(district.fileName)}`, { cache: 'no-store' });
      const payload = await response.json() as { markers?: PlaceMarker[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Recherche Google impossible.');
      setPlaceMarkers(payload.markers || []); setPlacesState('ready');
    } catch (reason) { setPlacesError(reason instanceof Error ? reason.message : 'Recherche Google impossible.'); setPlacesState('error'); }
  };

  const center = useMemo(() => selected?.bestCandidate.location || districts[0]?.bestCandidate.location || { lat: 28.0339, lng: 1.6596 }, [districts, selected]);
  if (!apiKey) return <section style={noticeStyle} role="alert"><h2>Clé Google Maps manquante</h2><p>Ajoutez <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> dans l’environnement local avec une clé autorisée pour Maps JavaScript.</p></section>;
  if (state === 'loading') return <section style={noticeStyle}>Chargement des candidats provisoires…</section>;
  if (state === 'error') return <section style={noticeStyle} role="alert">{error}</section>;
  if (!districts.length) return <section style={noticeStyle}><h2>Aucun candidat provisoire</h2><p>Géoréférencez manuellement un district depuis le tableau de bord. Seules deux preuves nommées convergentes à moins de 500 m apparaîtront ici.</p></section>;

  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: 16, minHeight: 620 }}>
    <aside style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, overflow: 'auto', background: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>Districts provisoires ({districts.length})</h2>
      <p style={{ color: '#475569', fontSize: 14 }}>Chaque point est une réponse Google corroborée par deux preuves distinctes.</p>
      {districts.map((district) => <button key={district.fileName} type="button" onClick={() => void selectDistrict(district)} style={{ display: 'block', width: '100%', textAlign: 'left', margin: '8px 0', padding: 10, border: selected?.fileName === district.fileName ? '2px solid #0f766e' : '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }}>
        <strong>{district.fileName}</strong><br />{district.administrative.commune || 'Commune inconnue'} · district {district.administrative.districtNumber || '—'}<br /><small>{district.maxDistanceMeters} m entre preuves</small>
      </button>)}
      {selected && <section style={{ marginTop: 16, borderTop: '1px solid #cbd5e1', paddingTop: 12 }}><h3 style={{ margin: '0 0 8px' }}>Repères et voies</h3>{placesState === 'loading' && <p>Recherche Google Places…</p>}{placesState === 'error' && <p role="alert">{placesError}</p>}{placesState === 'ready' && <><p style={{ fontSize: 13, color: '#475569' }}>{placeMarkers.length} repère(s) trouvé(s) : rouge sur la carte.</p><ul style={{ margin: 0, paddingLeft: 18 }}>{placeMarkers.map((marker) => <li key={`${marker.kind}:${marker.evidence}`}><button type="button" onClick={() => setSelectedEvidence(marker)} style={{ padding: 0, border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer', textAlign: 'left' }}>{marker.kind === 'landmark' ? 'Repère' : 'Voie'} · {marker.evidence}</button></li>)}</ul></>}</section>}
    </aside>
    <section style={{ minHeight: 620, borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1' }} aria-label="Carte des candidats provisoires">
      <APIProvider apiKey={apiKey}>
        <Map center={center} zoom={selected ? 16 : 6} gestureHandling="greedy" disableDefaultUI={false} style={{ width: '100%', height: '100%' }}>
          {districts.map((district) => <Marker key={district.fileName} position={district.bestCandidate.location} icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" label="D" zIndex={20} onClick={() => void selectDistrict(district)} title={`${district.fileName} — localisation provisoire du district`} />)}
          {placeMarkers.flatMap((marker, index) => [
            <Circle key={`circle:${marker.kind}:${marker.evidence}:${index}`} center={marker.location} radius={25} strokeColor="#b91c1c" strokeOpacity={1} strokeWeight={2} fillColor="#ef4444" fillOpacity={0.45} zIndex={5} />,
            <Marker key={`marker:${marker.kind}:${marker.evidence}:${index}`} position={marker.location} icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png" zIndex={10} onClick={() => setSelectedEvidence(marker)} title={`${marker.kind === 'landmark' ? 'Repère' : 'Voie'} : ${marker.evidence}`} />,
          ])}
          {selectedEvidence && <InfoWindow position={selectedEvidence.location} onCloseClick={() => setSelectedEvidence(null)}><div style={{ maxWidth: 260 }}><strong>{selectedEvidence.kind === 'landmark' ? 'Repère' : 'Voie'} : {selectedEvidence.evidence}</strong><p>{selectedEvidence.address}</p><small>Source : {selectedEvidence.source === 'places_new' ? 'Google Places' : 'Google Geocoding'}</small></div></InfoWindow>}
        </Map>
      </APIProvider>
    </section>
  </div>;
}

const noticeStyle = { padding: 24, border: '1px solid #cbd5e1', borderRadius: 12, background: '#fff', color: '#334155' };
