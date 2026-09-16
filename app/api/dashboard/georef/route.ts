import { georeferenceDistrict } from '@/lib/georef-agent';
import { appendGeoreferenceAudit, readGeoreferences, writeGeoreferenceIfAbsent } from '@/lib/georef-store';
import { readTasks } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { fileName?: unknown };
    if (typeof body.fileName !== 'string') return Response.json({ error: 'fileName requis' }, { status: 400 });
    const task = (await readTasks()).find((candidate) => candidate.fileName === body.fileName);
    if (!task || !['done', 'finished'].includes(task.status) || !task.result) return Response.json({ error: 'Analyse Vision terminée requise.', code: 'not_eligible' }, { status: 422 });
    if ((await readGeoreferences())[body.fileName]) {
      await appendGeoreferenceAudit({ sourceFile: body.fileName, at: new Date().toISOString(), outcome: 'already_exists', searchedEvidence: [], reason: 'Un candidat provisoire est déjà enregistré.' });
      return Response.json({ error: 'Un candidat provisoire existe déjà pour ce fichier.', code: 'already_exists' }, { status: 409 });
    }
    const outcome = await georeferenceDistrict(task.result);
    const at = new Date().toISOString();
    if (outcome.status !== 'provisional') {
      await appendGeoreferenceAudit({ sourceFile: body.fileName, at, outcome: outcome.status, searchedEvidence: outcome.searchedEvidence, reason: outcome.reason });
      return Response.json({ error: outcome.reason, code: outcome.status, searchedEvidence: outcome.searchedEvidence }, { status: 422 });
    }
    const saved = await writeGeoreferenceIfAbsent(body.fileName, outcome.georeference);
    if (!saved) return Response.json({ error: 'Un candidat provisoire existe déjà pour ce fichier.', code: 'already_exists' }, { status: 409 });
    await appendGeoreferenceAudit({ sourceFile: body.fileName, at, outcome: 'provisional', searchedEvidence: outcome.searchedEvidence, georeference: outcome.georeference });
    return Response.json({ status: 'provisional', georeference: outcome.georeference }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Géoréférencement refusé' }, { status: 503 });
  }
}
