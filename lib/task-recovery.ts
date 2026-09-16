import type { Task } from './store';

export const STALE_ANALYSIS_MS = 10 * 60 * 1000;

export function recoverStalledTaskList(tasks: Task[], now = Date.now(), timeoutMs = STALE_ANALYSIS_MS) {
  const recovered: string[] = [];
  const next = tasks.map((task) => {
    if (task.status !== 'running' || !task.startedAt) return task;
    const startedAt = Date.parse(task.startedAt);
    if (!Number.isFinite(startedAt) || now - startedAt <= timeoutMs) return task;
    recovered.push(task.id);
    return { ...task, status: 'queued' as const, startedAt: undefined, finishedAt: undefined, error: undefined };
  });
  return { tasks: next, recovered };
}
