import { readTasks } from '@/lib/store';

// GET /api/dashboard/districts/files → liste des fichiers districts avec extraction Vision AI
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const tasks = await readTasks();
    
    // TODO: Filtrer et retourner les données d'extractions Vision AI + géoréférencement
    
    return Response.json({ files: tasks, total: tasks.length });

  } catch (error) {
    console.error('Erreur districts/files:', error);
    return Response.json({ error }, { status: 500 });
  }
}
