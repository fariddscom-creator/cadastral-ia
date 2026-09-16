import { inventory } from './croquis';
import { readTasks } from './store';
import { needsReview } from './review-status';

export type DashboardTask = Awaited<ReturnType<typeof readTasks>>[number];
export type DashboardData = {
  model: string;
  files: Array<Awaited<ReturnType<typeof inventory>>[number] & { task: DashboardTask | null }>;
  summary: { total: number; queued: number; running: number; done: number; failed: number };
};

export async function getDashboardData(): Promise<DashboardData> {
  const [files, tasks] = await Promise.all([inventory(), readTasks()]);
  const byFile = new Map(tasks.map((task) => [task.fileName, task]));
  const currentTasks = files.map((file) => byFile.get(file.fileName) || null);
  return {
    model: process.env.QWEN_VISION_MODEL?.trim() || 'qwen3-vl:30b',
    files: files.map((file) => ({ ...file, task: byFile.get(file.fileName) || null })),
    summary: {
      total: files.length,
      queued: currentTasks.filter((task) => task?.status === 'queued').length,
      running: currentTasks.filter((task) => task?.status === 'running').length,
      done: currentTasks.filter((task) => task && ['done', 'finished'].includes(task.status) && !needsReview(task)).length,
      failed: currentTasks.filter(needsReview).length,
    },
  };
}
