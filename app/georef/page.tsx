import GeorefMapClient from './georef-map-client';

export const dynamic = 'force-dynamic';

export default function GeorefPage() {
  return <main style={{ minHeight: '100vh', padding: 24, background: '#f8fafc' }}>
    <header style={{ maxWidth: 1440, margin: '0 auto 16px' }}>
      <p style={{ color: '#0f766e', fontWeight: 700, marginBottom: 4 }}>CADASTRE · GÉORÉFÉRENCEMENT</p>
      <h1 style={{ margin: 0 }}>Districts provisoires sur la carte</h1>
      <p>Les points affichés sont des candidats révisables, jamais des limites cadastrales validées.</p>
    </header>
    <div style={{ maxWidth: 1440, margin: '0 auto' }}><GeorefMapClient apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} /></div>
  </main>;
}
