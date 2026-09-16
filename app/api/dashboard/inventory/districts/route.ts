import { readTasks } from '@/lib/store';

// GET /api/dashboard/inventory/districts → liste des districts avec infos d'extractions Vision AI
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const tasks = await readTasks();
    const query = new URL(request.url);
    const districtNumber = query.searchParams.get('districtNumber');
    const wilaya = query.searchParams.get('wilaya');
    
    // TODO: Filtrer par district/wilaya et retourner les données complètes d'extractions Vision AI
    
    const districts = tasks.filter((task) => {
      const fileName = task.fileName || task.sourceFile || '';
      return (
        (!districtNumber || fileName.includes(districtNumber)) &&
        (!wilaya || fileName.startsWith(`${wilaya}.`))
      );
    });

    return Response.json({ districts });

  } catch (error) {
    console.error('Erreur inventory:', error);
    return Response.json({ error }, { status: 500 });
  }
}
