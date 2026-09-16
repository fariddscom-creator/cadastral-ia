import { runQwenVision } from './qwen-vision';
import { readTasks, recoverStalledTasks, updateTask, type Task } from './store';

let queueRunning = false;

export async function processTask(taskId: string): Promise<Task> {
  const task = (await readTasks()).find((candidate) => candidate.id === taskId);
  if (!task) throw new Error('Tâche introuvable');
  if (task.status === 'running') throw new Error('Cette tâche est déjà en cours');
  await updateTask(task.id, { status: 'running', startedAt: new Date().toISOString(), error: undefined });
  try {
    const result = await runQwenVision(task.fileName);
    await updateTask(task.id, { status: 'done', result, finishedAt: new Date().toISOString() });
  } catch (error) {
    await updateTask(task.id, { status: 'failed', error: error instanceof Error ? error.message : 'Erreur Vision inconnue', finishedAt: new Date().toISOString() });
  }
  return (await readTasks()).find((candidate) => candidate.id === task.id)!;
}

export async function processNextTask(): Promise<Task | null> {
  const task = (await readTasks()).find((candidate) => candidate.status === 'queued');
  return task ? processTask(task.id) : null;
}

/**
 * Consomme la file Qwen une tâche à la fois. L'état est conservé côté serveur :
 * fermer ou rafraîchir le navigateur n'interrompt donc pas le lot démarré.
 */
export function startQueueProcessing(): boolean {
  if (queueRunning) return false;
  queueRunning = true;
  void (async () => {
    try {
      await recoverStalledTasks();
      while (await processNextTask()) {
        // Le traitement suivant ne commence qu'après la persistance du précédent.
      }
    } finally {
      queueRunning = false;
      // Couvre le cas rare d'un ajout exactement après le dernier contrôle de file.
      if ((await readTasks()).some((task) => task.status === 'queued')) startQueueProcessing();
    }
  })();
  return true;
}
