import { after } from 'next/server';
import { queueAnalysis } from '@/lib/analysis-request';
import { readTasks } from '@/lib/store';
import { startQueueProcessing } from '@/lib/vision-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { files?: unknown };
    const tasks = await queueAnalysis(body.files);
    after(() => { void startQueueProcessing(); });
    return Response.json({ queued: tasks.length, tasks, accepted: true }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Mise en file refusée' }, { status: 400 });
  }
}

export async function GET() {
  const tasks = await readTasks();
  return Response.json({
    taskSummary: {
      total: tasks.length,
      done: tasks.filter((task) => ['done', 'finished'].includes(task.status)).length,
      running: tasks.filter((task) => task.status === 'running').length,
      queued: tasks.filter((task) => task.status === 'queued').length,
      failed: tasks.filter((task) => task.status === 'failed').length,
    },
  });
}
