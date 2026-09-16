import { inventory } from './croquis';
import { enqueueTasks, type Task } from './store';

export async function queueAnalysis(fileNames?: unknown): Promise<Task[]> {
  const files = await inventory();
  const available = new Set(files
    .filter((file) => ['pdf', 'jpeg', 'png', 'tiff'].includes(file.kind || ''))
    .map((file) => file.fileName));
  const requested = Array.isArray(fileNames)
    ? fileNames.filter((fileName): fileName is string => typeof fileName === 'string')
    : [...available];
  const unknown = requested.filter((fileName) => !available.has(fileName));
  if (unknown.length) throw new Error(`Croquis introuvable ou non pris en charge : ${unknown.join(', ')}`);
  return enqueueTasks([...new Set(requested)]);
}
