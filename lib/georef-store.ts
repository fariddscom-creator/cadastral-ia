import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoredGeoreference } from './export';

const georeferencesFile = path.join(process.cwd(), 'data', 'georeferences.json');
const auditFile = path.join(process.cwd(), 'data', 'georeference-audit.json');
let mutationChain: Promise<void> = Promise.resolve();

export type GeoreferenceAudit = {
  sourceFile: string;
  at: string;
  outcome: 'provisional' | 'not_eligible' | 'no_convergence' | 'already_exists';
  searchedEvidence: string[];
  reason?: string;
  georeference?: StoredGeoreference;
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) as T; } catch { return fallback; }
}

async function atomicWrite(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(value, null, 2));
  await fs.rename(temporary, file);
}

async function mutate<T>(action: () => Promise<T>) {
  let release: (() => void) | undefined;
  const previous = mutationChain;
  mutationChain = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await action(); } finally { release?.(); }
}

export function readGeoreferences(): Promise<Record<string, StoredGeoreference>> {
  return readJson(georeferencesFile, {});
}

/** Clears the current provisional map registry while preserving the append-only audit trail. */
export async function clearGeoreferences() {
  await mutate(async () => {
    await atomicWrite(georeferencesFile, {});
  });
}

export async function writeGeoreferenceIfAbsent(sourceFile: string, value: StoredGeoreference) {
  return mutate(async () => {
    const existing = await readGeoreferences();
    if (existing[sourceFile]) return false;
    await atomicWrite(georeferencesFile, { ...existing, [sourceFile]: { ...value, savedAt: new Date().toISOString() } });
    return true;
  });
}

export async function appendGeoreferenceAudit(entry: GeoreferenceAudit) {
  return mutate(async () => {
    const history = await readJson<GeoreferenceAudit[]>(auditFile, []);
    await atomicWrite(auditFile, [...history, entry]);
  });
}
