import { promises as fs } from 'node:fs';
import path from 'node:path';

const EPT0_DIR = '/projets/cadst-ia/croquis/EPT0-images';
const statsFile = path.join(process.cwd(), 'data', 'dashboard-stats.json');

export const supportedKinds = new Set(['png', 'jpeg', 'jpg', 'tiff']);

function parseFileName(fileName: string): { wilaya: string; daira: string; district: string } | null {
  const match = fileName.match(/^(\d+)\.(\d+)\.?/);
  if (!match) return null;
  return {
    wilaya: match[1],
    daira: match[2].padEnd(2, '0').slice(0, 2), // WW.DD.Nnn → daira DD (padded with 0)
    district: fileName.split('.').filter(Boolean)[2] || '',
  };
}

export async function inventoryFiles(): Promise<{ fileName: string; size: number; parsed?: { wilaya: string; daira: string; district: string } }[]> {
  try {
    const entries = await fs.readdir(EPT0_DIR, { withFileTypes: true });
    const files: { fileName: string; size: number; parsed?: { wilaya: string; daira: string; district: string } }[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(EPT0_DIR, entry.name);
      const stat = await fs.stat(fullPath);
      const parsed = parseFileName(entry.name) || undefined;
      files.push({
        fileName: entry.name,
        size: stat.size,
        parsed,
      });
    }

    return files.sort((a, b) => {
      if (!a.parsed || !b.parsed) return 0;
      // Sort by wilaya.district → D.DD.Nnn ascending
      const waA = a.parsed.wilaya.padEnd(2, '0');
      const dA = a.parsed.daira.padStart(3, '0');
      const distA = a.parsed.district;
      const wbB = b.parsed.wilaya.padEnd(2, '0');
      const dB = b.parsed.daira.padStart(3, '0');
      const distB = b.parsed.district;
      
      if (waA < wbB) return -1;
      if (waA > wbB) return 1;
      
      if (dA < dB) return -1;
      if (dA > dB) return 1;
      
      return distA.localeCompare(distB, 'fr', { numeric: true });
    });

  } catch {
    return [];
  }
}

export async function saveStats(stats: DashboardStats) {
  await fs.mkdir(path.dirname(statsFile), { recursive: true });
  await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
}

export async function loadStats(): Promise<DashboardStats> {
  try {
    return JSON.parse(await fs.readFile(statsFile, 'utf8'));
  } catch {
    return { files: [], pending: 0, done: 0, failed: 0 };
  }
}

export type DashboardStats = {
  files?: unknown[];
  pending: number;
  done: number;
  failed: number;
};
