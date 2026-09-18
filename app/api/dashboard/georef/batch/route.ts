import { readTasks } from '@/lib/store';
import { readGeoreferences } from '@/lib/georef-store';
import { georeferenceDistrict } from '@/lib/georef-agent';
import { appendGeoreferenceAudit, writeGeoreferenceIfAbsent } from '@/lib/georef-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { fileName?: string };
    const tasks = await readTasks();
    const georeferences = await readGeoreferences();
    
    // Filtrer les tâches éligibles : status 'done' et pas déjà géoréférencées
    const eligibleTasks = tasks.filter((task) => 
      ['done', 'finished'].includes(task.status) 
      && task.result 
      && !georeferences[task.fileName]
      && (body.fileName ? task.fileName === body.fileName : true)
    );

    if (eligibleTasks.length === 0) {
      return Response.json({ 
        processed: 0, 
        success: 0, 
        failed: 0, 
        message: 'Aucun district éligible au géoréférencement.' 
      }, { status: 200 });
    }

    const results: Array<{ fileName: string; status: string; error?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    // Traiter chaque tâche éligible
    for (const task of eligibleTasks) {
      try {
        const outcome = await georeferenceDistrict(task.result!);
        const at = new Date().toISOString();
        
        if (outcome.status !== 'provisional') {
          await appendGeoreferenceAudit({ 
            sourceFile: task.fileName, 
            at, 
            outcome: outcome.status, 
            searchedEvidence: outcome.searchedEvidence, 
            reason: outcome.reason 
          });
          results.push({ fileName: task.fileName, status: outcome.status, error: outcome.reason });
          failedCount += 1;
        } else {
          const saved = await writeGeoreferenceIfAbsent(task.fileName, outcome.georeference);
          if (!saved) {
            results.push({ fileName: task.fileName, status: 'already_exists', error: 'Déjà enregistré' });
            failedCount += 1;
          } else {
            await appendGeoreferenceAudit({ 
              sourceFile: task.fileName, 
              at, 
              outcome: 'provisional', 
              searchedEvidence: outcome.searchedEvidence, 
              georeference: outcome.georeference 
            });
            results.push({ fileName: task.fileName, status: 'provisional' });
            successCount += 1;
          }
        }
      } catch (error) {
        results.push({ 
          fileName: task.fileName, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        failedCount += 1;
      }
    }

    return Response.json({ 
      processed: results.length, 
      success: successCount, 
      failed: failedCount, 
      results 
    }, { status: 200 });
  } catch (error) {
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Géoréférencement batch refusé' 
    }, { status: 503 });
  }
}
