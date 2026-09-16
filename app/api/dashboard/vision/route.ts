import { after } from 'next/server';
import { queueAnalysis } from '@/lib/analysis-request';
import { startQueueProcessing } from '@/lib/vision-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Compatibility endpoint: analysis always uses the persisted Qwen queue. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { fileName?: unknown };
    if (typeof body.fileName !== 'string') return Response.json({ error: 'fileName requis' }, { status: 400 });
    const [task] = await queueAnalysis([body.fileName]);
    after(() => { void startQueueProcessing(); });
    return Response.json({ task, accepted: true }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Mise en file refusée' }, { status: 400 });
  }
}
