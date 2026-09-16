import { readTasks } from '../../../../../lib/store';

// GET /api/dashboard/nav/batches → liste de batchs d'extractions Vision AI + géoréférencement
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // TODO: Récupération des batchs depuis tasks.json
    
    return Response.json({ batches: [] });

  } catch (error) {
    console.error('Erreur nav/batches:', error);
    return Response.json({ error }, { status: 500 });
  }
}
