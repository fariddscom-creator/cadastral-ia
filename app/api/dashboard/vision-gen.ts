import { readTasks } from '@/lib/store';

// POST /api/dashboard/generate → générer routes API Vision AI + SIG pour dashboard cadastre
export const runtime = 'nodejs';

export async function GENERATE(
  request: Request,
  { params }: { params: Promise<{ name?: string; type?: string }> },
) {
  try {
    const tasks = await readTasks();
    
    // TODO: Génération routes API Vision AI + SIG pour extraction complète
    
    return Response.json({ error: 'Non configuré' });

  } catch (error) {
    console.error('Erreur generation vision:', error);
    return Response.json({ error }, { status: 500 });
  }
}
