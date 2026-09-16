import { promises as fs } from 'node:fs';
import path from 'node:path';

export const tasksFile = path.join(process.cwd(), 'data', 'tasks.json');

type TaskStatus = 'queued' | 'running' | 'done' | 'failed';

export type Task = {
  id: string;
  sourceFile: string;
  action: 'launch' | 'georeference';
  status: TaskStatus;
  createdAt: string;
};

// GET /api/tasks/route.ts → read tasks store
export async function readTasks(): Promise<Task[]> {
  try {
    return JSON.parse(await fs.readFile(tasksFile, 'utf8')) as Task[];
  } catch {
    return [];
  }
}

// POST /api/tasks/route.ts → queue vision task
export async function queueVision(fileName: string, status: TaskStatus): Promise<Task[]> {
  const existing = await readTasks();
  if (!existing.find((t) => t.sourceFile === fileName && !['finished', 'done'].includes(t.status))) {
    existing.push({
      id: crypto.randomUUID(),
      sourceFile: fileName,
      action: 'launch',
      status,
      createdAt: new Date().toISOString(),
    } as Task);
  }

  await fs.writeFile(tasksFile, JSON.stringify(existing, null, 2));
  return existing;
}

// GET /api/queue/status → get stats summary without loading full tasks
export async function taskStats(): Promise<{ queued: number; running: number; done: number; failed: number }> {
  const existing = await readTasks();
  return {
    queued: existing.filter((t) => t.status === 'queued').length,
    running: existing.filter((t) => t.status === 'running').length,
    done: existing.filter((t) => t.status === 'done').length,
    failed: existing.filter((t) => t.status === 'failed').length,
  };
}
