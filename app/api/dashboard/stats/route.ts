import { promises as fs } from 'node:fs';
import path from 'node:path';

const statsFile = path.join(process.cwd(), 'data', 'dashboard-stats.json');

type DashboardStats = {
  total?: number;
  pending?: number;
  done?: number;
  failed?: number;
  running?: number;
};

export const runtime = 'nodejs';

// GET /api/dashboard/stats → aggregate stats
export async function GET() {
  try {
    const stats: DashboardStats = await fs.readFile(statsFile, 'utf8').then(JSON.parse).catch(() => ({}));
    stats.total ??= (stats.pending || 0) + (stats.running || 0) + (stats.done || 0) + (stats.failed || 0);
    return Response.json(stats);
  } catch {
    return Response.json({ total: 0, pending: 0, running: 0, done: 0, failed: 0 }, { status: 200 });
  }
}

// POST /api/dashboard/stats → update stats
export async function PATCH(request: Request) {
  const body = await request.json();

  if (!body.pending || typeof body.pending !== 'number') {
    return Response.json({ error: 'pending must be an integer' }, { status: 400 });
  }

  try {
    await fs.writeFile(statsFile, JSON.stringify(body, null, 2));
    return Response.json({ saved: true }, { status: 202 });
  } catch {
    return Response.json({ error: 'Write failed' }, { status: 500 });
  }
}
