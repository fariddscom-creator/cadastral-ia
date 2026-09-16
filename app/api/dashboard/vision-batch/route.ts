import { after } from 'next/server';
import { queueAnalysis } from '@/lib/analysis-request';
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
