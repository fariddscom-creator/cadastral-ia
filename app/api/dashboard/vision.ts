import { updateTask } from '@/lib/store';

// POST /api/dashboard/vision/{fileName} → déclencher exraiction Vision AI pour un fichier nommé
export const runtime = 'nodejs';

function parseFileName(fileName: string): { wilaya?: number; daira?: number; district?: string } | null {
  // Récupère les nombres à partir du nom de fichier : "16.08.05.png" → w=16, d=08, dist=05
  const match = fileName.match(/\d+(?:\.\d+)?/);
  if (!match) return null;

  // TODO: Parse le numéro de district et retourne les coordonnées GPS calculées
  
  return { wilaya: Number(match[1]) };
}

export async function POST(request: Request, { params }: { params: Promise<{ file?: string }> }) {
  try {
    const body = await request.json();
    const fileName = request.url.match(/fileName=(.*)/)?.[1] || body.fileName || 'unknown';

    // TODO: Lancement d'extraction Vision AI pour le fichier fourni
    
    return Response.json({ message: 'En cours de traitement...' });

  } catch (error) {
    console.error('Erreur extraction vision:', error);
    return Response.json({ error: 'Erreur d\'extraction' }, { status: 500 });
  }
}
