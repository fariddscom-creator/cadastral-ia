import { readTasks } from '../../../../lib/store';

// GET /api/dashboard/export-data → export des données d'extraction Vision AI vers CSV/JSON/TIGER
export const runtime = 'nodejs';

export async function GET(request: Request, params?: Promise<{ format?: string; file?: string }>) {
  try {
    const tasks = await readTasks();
    
    // TODO: Génération fichier export des données extraction complète
    
    return Response.json({ error: 'Export non configuré!' });

  } catch (error) {
    console.error('Erreur export data:', error);
    return Response.json({ error }, { status: 500 });
  }
}
