import type { Task } from './store';

export function referenceCount(task: Task | null): number {
  return new Set([...(task?.result?.landmarks || []), ...(task?.result?.streets || [])]
    .map((name) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr'))
    .filter(Boolean)).size;
}

export function needsReview(task: Task | null): boolean {
  if (!task) return false;
  if (task.status === 'failed') return true;
  return ['done', 'finished'].includes(task.status) && referenceCount(task) < 2;
}
