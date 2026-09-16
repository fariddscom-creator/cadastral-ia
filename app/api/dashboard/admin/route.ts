import { readTasks } from '@/lib/store';
import type { GeoreferenceOutcome } from '@/lib/georef-agent';
import type { VisionExtractionResult } from '@/lib/vision-agent';

// GET /api/dashboard/admin → admin API pour exraire tous les textes et icônes d'un district
export const runtime = 'nodejs';

function extractDistrictInfo(fileNames: string[]): Promise<VisionExtractionResult & { georef?: GeoreferenceOutcome }> {
  // TODO: Lancement d'extraction Vision + géoréférencement unifiée

  return new Promise(resolve => setTimeout(() => resolve({
    source_file: fileNames[0] || 'unknown',
    administrative: {
      wilaya: '',
      daira_or_ca: '',
      commune: '',
      district_number: '',
      scale: '',
    },
    streets: [],
    landmarks: [],
    icons: [{ type: 'mosque', name: null, pixel: [0, 0, 0, 0], confidence: 0, legend: '' }],
    legends: [],
    district_boundary: [],
    north_arrow_degrees: null,
    extraction_confidence: 0,
    warnings: [],
  }), 10));
}

export async function GET(request: Request) {
  try {
    const tasks = await readTasks();
    
    // Filtrer les tâches à exraire
    const filesToProcess = tasks.filter(t => t.status === 'done' || t.status === 'georeferencing');
    
    if (!filesToProcess.length) {
      return Response.json({ error: 'Aucune tâche trouvée' }, { status: 404 });
    }
  
    return Response.json({ 
      fileName: filesToProcess[0]?.fileName,
      district: await extractDistrictInfo(filesToProcess.map((t) => t.fileName || t.sourceFile || '').filter(Boolean)),
    });

  } catch (error) {
    console.error('Erreur admin extraction:', error);
    return Response.json({ error }, { status: 500 });
  }
}
