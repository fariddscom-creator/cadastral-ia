import { readTasks } from '../../../../lib/store';

// POST /api/dashboard/exports → export des résultats d'extraction Vision + SIG en CSV/JSON/TIGER
export const runtime = 'nodejs';

type ExportFormat = 'json' | 'csv' | 'tiger';

function formatCSV(records: any[]): string {
  // TODO: Générer un fichier CSV avec toutes les données d'extractions
  
  return 'colonne1,colonne2,...';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const format = (body.format as ExportFormat) || 'tableau';

    // TODO: Génération du fichier pour export

    return Response.json({
      url: '/api/dashboard/exports/result.csv', // Placeholder
      contentType: 'application/octet-stream',
    });
    // Note: Pour le vrai upload, utiliser des Web Workers ou streams Node.js

  } catch (error) {
    console.error('Erreur exports extraction:', error);
    return Response.json({ error }, { status: 500 });
  }
}
