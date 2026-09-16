import { getDashboardData } from '@/lib/dashboard-data';
import { captureOnsSourceBaselines, clearTasks, enqueueOnsReanalysis, enqueueTask, enqueueTasks, readTasks } from '@/lib/store';
import { clearGeoreferences } from '@/lib/georef-store';
import { inventory } from '@/lib/croquis';
import { planAnalysisBatch } from '@/lib/core';
import { startQueueProcessing } from '@/lib/vision-queue';
import { after } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getDashboardData());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { action?: 'enqueue' | 'process-next' | 'process' | 'auto' | 'reset' | 'capture-ons-baselines' | 'reanalyse-ons'; fileName?: string };
  if (body.action === 'reset') {
    // Une tâche Qwen déjà lancée peut terminer après ce point, mais updateTask
    // ne recrée jamais une tâche supprimée : son résultat est donc écarté.
    await Promise.all([clearTasks(), clearGeoreferences()]);
    return Response.json({ cleared: true, provisionalGeoreferencesCleared: true });
  }
  if (body.action === 'auto') {
    const [files, tasks] = await Promise.all([inventory(), readTasks()]);
    const scheduled = planAnalysisBatch(files, tasks);
    await enqueueTasks(scheduled);
    after(() => { startQueueProcessing(); });
    return Response.json({ queued: scheduled.length, accepted: true }, { status: 202 });
  }
  if (body.action === 'process-next') {
    const task = (await readTasks()).find((candidate) => candidate.status === 'queued');
    if (!task) return Response.json({ task: null });
    after(() => { startQueueProcessing(); });
    return Response.json({ task: { ...task, status: 'queued' }, accepted: true }, { status: 202 });
  }
  if (body.action === 'capture-ons-baselines') {
    return Response.json({ captured: await captureOnsSourceBaselines() });
  }
  if (!body.fileName) return Response.json({ error: 'fileName requis' }, { status: 400 });
  if (body.action === 'reanalyse-ons') {
    try {
      const task = await enqueueOnsReanalysis(body.fileName);
      after(() => { startQueueProcessing(); });
      return Response.json({ task, accepted: true }, { status: 202 });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Réanalyse ONS refusée' }, { status: 409 });
    }
  }
  if (body.action === 'process') {
    const task = await enqueueTask(body.fileName);
    after(() => { startQueueProcessing(); });
    return Response.json({ task, accepted: true }, { status: 202 });
  }
  return Response.json({ task: await enqueueTask(body.fileName) }, { status: 201 });
}
