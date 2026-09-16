import { sanitizeGeoreferenceEvidence, type VisionResult } from './qwen-vision';
import { reconcileAdministrative } from './administrative-reference';
import { recoverStalledTaskList } from './task-recovery';
import { sourceFingerprint, type SourceFingerprint } from './croquis';

export type Task = {
  id: string;
  fileName: string;
  sourceFile: string;
  action?: 'launch' | 'georeference' | 'ons-reanalysis';
  status: 'queued' | 'running' | 'done' | 'failed' | 'georeferencing' | 'finished';
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  result?: VisionResult;
  sourceFingerprint?: SourceFingerprint;
};

const tasksFile = 'data/tasks.json';
let mutationChain: Promise<void> = Promise.resolve();

function normalizeTasks(tasks: Array<Partial<Task>>): Task[] {
  return tasks.map((task) => ({
    id: task.id || `legacy:${encodeURIComponent(task.fileName || task.sourceFile || 'unknown')}:${task.createdAt || 'unknown'}`,
    fileName: task.fileName || task.sourceFile || '',
    sourceFile: task.sourceFile || task.fileName || '',
    action: task.action || 'launch',
    status: task.status || 'queued',
    createdAt: task.createdAt || new Date().toISOString(),
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    error: task.error,
    result: task.result,
    sourceFingerprint: task.sourceFingerprint,
  }));
}

async function readTasksFile(): Promise<Task[]> {
  const { promises: fs } = await import('node:fs');
  const path = await import('node:path');
  try {
    const tasks = normalizeTasks(JSON.parse(await fs.readFile(path.join(process.cwd(), tasksFile), 'utf8')) as Array<Partial<Task>>);
    return Promise.all(tasks.map(async (task) => task.result ? { ...task, result: await reconcileAdministrative(sanitizeGeoreferenceEvidence(task.result)) } : task));
  } catch {
    return [];
  }
}

async function writeTasksFile(tasks: Task[]) {
  const { promises: fs } = await import('node:fs');
  const path = await import('node:path');
  const target = path.join(process.cwd(), tasksFile);
  const temporary = `${target}.${crypto.randomUUID()}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(temporary, JSON.stringify(tasks, null, 2));
  await fs.rename(temporary, target);
}

async function mutateTasks<T>(mutation: () => Promise<T>): Promise<T> {
  let release: (() => void) | undefined;
  const previous = mutationChain;
  mutationChain = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    return await mutation();
  } finally {
    release?.();
  }
}

export async function readTasks(): Promise<Task[]> {
  return readTasksFile();
}

export async function writeTasks(tasks: Task[]) {
  await mutateTasks(() => writeTasksFile(tasks));
}

export async function clearTasks() {
  await mutateTasks(() => writeTasksFile([]));
}

export async function updateTask(id: string, patch: Partial<Task>) {
  await mutateTasks(async () => {
    const tasks = await readTasksFile();
    const idx = tasks.findIndex((task) => task.id === id);
    if (idx >= 0) await writeTasksFile(tasks.map((task, index) => index === idx ? { ...task, ...patch } : task));
  });
}

export async function enqueueTask(fileName: string): Promise<Task> {
  return mutateTasks(async () => {
    const tasks = await readTasksFile();
    const task = await enqueueTaskInList(tasks, fileName);
    await writeTasksFile(tasks);
    return task;
  });
}

async function enqueueTaskInList(tasks: Task[], fileName: string): Promise<Task> {
  const existing = tasks.find((task) => task.fileName === fileName && ['queued', 'running'].includes(task.status));
  if (existing) return existing;
  const task: Task = { id: crypto.randomUUID(), fileName, sourceFile: fileName, action: 'launch', status: 'queued', createdAt: new Date().toISOString(), sourceFingerprint: await sourceFingerprint(fileName) || undefined };
  const previousIndex = tasks.findIndex((candidate) => candidate.fileName === fileName);
  if (previousIndex >= 0) tasks[previousIndex] = task;
  else tasks.push(task);
  return task;
}

export function isOnsSourceReplacement(recorded: SourceFingerprint | undefined, current: SourceFingerprint | null) {
  return Boolean(recorded && current && recorded.sha256 !== current.sha256);
}

/** Adds a baseline only for legacy tasks; it never overwrites an existing source fingerprint. */
export async function captureOnsSourceBaselines(): Promise<number> {
  return mutateTasks(async () => {
    const tasks = await readTasksFile();
    let captured = 0;
    const updated = await Promise.all(tasks.map(async (task) => {
      if (task.sourceFingerprint) return task;
      const fingerprint = await sourceFingerprint(task.fileName);
      if (!fingerprint) return task;
      captured += 1;
      return { ...task, sourceFingerprint: fingerprint };
    }));
    if (captured) await writeTasksFile(updated);
    return captured;
  });
}

/** Queues one manual ONS replacement only when the source bytes differ from its recorded baseline. */
export async function enqueueOnsReanalysis(fileName: string): Promise<Task> {
  return mutateTasks(async () => {
    const tasks = await readTasksFile();
    const index = tasks.findIndex((task) => task.fileName === fileName);
    if (index < 0) throw new Error('Croquis introuvable dans les résultats existants');
    const existing = tasks[index];
    if (existing.status === 'queued' || existing.status === 'running') throw new Error('Cette analyse est déjà en cours');
    const current = await sourceFingerprint(fileName);
    if (!current) throw new Error('Croquis ONS introuvable ou non autorisé');
    if (!existing.sourceFingerprint) throw new Error('Empreinte source initiale absente : initialiser les empreintes ONS avant réanalyse');
    if (!isOnsSourceReplacement(existing.sourceFingerprint, current)) throw new Error('Le fichier source n’a pas changé : la réanalyse ONS est refusée');
    const task: Task = {
      id: crypto.randomUUID(), fileName, sourceFile: fileName, action: 'ons-reanalysis', status: 'queued', createdAt: new Date().toISOString(), sourceFingerprint: current,
    };
    tasks[index] = task;
    await writeTasksFile(tasks);
    return task;
  });
}

export async function enqueueTasks(fileNames: string[]): Promise<Task[]> {
  return mutateTasks(async () => {
    const tasks = await readTasksFile();
    const queued = await Promise.all(fileNames.map((fileName) => enqueueTaskInList(tasks, fileName)));
    await writeTasksFile(tasks);
    return queued;
  });
}

/** Restores analyses interrupted by a process restart or a timed-out model call. */
export async function recoverStalledTasks(now = Date.now()): Promise<string[]> {
  return mutateTasks(async () => {
    const current = await readTasksFile();
    const { tasks, recovered } = recoverStalledTaskList(current, now);
    if (recovered.length) await writeTasksFile(tasks);
    return recovered;
  });
}
