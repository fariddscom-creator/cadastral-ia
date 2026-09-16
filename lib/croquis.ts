import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { detectSignature, isSafeSourceName, type InventoryRow } from './core';

export const sourceDir = () =>
  path.resolve(process.env.CROQUIS_DIR || path.join(process.cwd(), 'croquis', 'EPT0-images'));

export async function inventory(): Promise<InventoryRow[]> {
  const root = sourceDir();
  const entries = await fs.readdir(root, { withFileTypes: true });
  const rows = await Promise.all(
    entries.filter((entry) => entry.isFile()).map(async (entry) => {
      const sourcePath = path.join(root, entry.name);
      const stat = await fs.stat(sourcePath);
      const handle = await fs.open(sourcePath, 'r');
      try {
        const header = Buffer.alloc(Math.min(16, stat.size));
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        return {
          fileName: entry.name,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          kind: detectSignature(header.subarray(0, bytesRead)),
        };
      } finally {
        await handle.close();
      }
    }),
  );
  return rows.sort((left, right) => left.fileName.localeCompare(right.fileName, 'fr', { numeric: true }));
}

export async function safeSourcePath(name: string) {
  if (!isSafeSourceName(name)) return null;
  const root = sourceDir();
  const target = path.resolve(root, name);
  if (!target.startsWith(`${root}${path.sep}`)) return null;
  try {
    const [realRoot, realTarget] = await Promise.all([fs.realpath(root), fs.realpath(target)]);
    if (!realTarget.startsWith(`${realRoot}${path.sep}`)) return null;
    const stat = await fs.stat(realTarget);
    return stat.isFile() ? realTarget : null;
  } catch {
    return null;
  }
}

export async function safeFile(name: string) {
  const sourcePath = await safeSourcePath(name);
  return sourcePath ? fs.readFile(sourcePath) : null;
}

export type SourceFingerprint = { sha256: string; size: number; modifiedAt: string };

export async function sourceFingerprint(name: string): Promise<SourceFingerprint | null> {
  const sourcePath = await safeSourcePath(name);
  if (!sourcePath) return null;
  const [bytes, stat] = await Promise.all([fs.readFile(sourcePath), fs.stat(sourcePath)]);
  return { sha256: createHash('sha256').update(bytes).digest('hex'), size: stat.size, modifiedAt: stat.mtime.toISOString() };
}
