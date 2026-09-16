import { readTasks } from '@/lib/store';

// GET /api/dashboard/records/{fileName} → récupère les records d'extraction pour un fichier
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file?: string }> },
) {
  try {
    const { file } = await params;
    const fileName = file || (new URL(request.url).searchParams.get('file'));
    
    if (!fileName) {
      return Response.json({ error: 'Paramètre ?file=? requis' }, { status: 400 });
    }

    // TODO: Retourner les données d'extractions complet du fichier
    
    const tasks = await readTasks();
    return Response.json({ records: tasks.filter((task) => (task.fileName || task.sourceFile) === fileName) });

  } catch (error) {
    console.error('Erreur extraction records:', error);
    return Response.json({ error }, { status: 500 });
  }
}
