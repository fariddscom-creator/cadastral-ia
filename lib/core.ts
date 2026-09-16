export type FileKind = 'pdf' | 'jpeg' | 'tiff' | 'png' | 'all-zero' | 'corrupt';
export type Gcp = {
  reliable: boolean;
  x: number;
  y: number;
  longitude?: number;
  latitude?: number;
  rmse?: number;
};
export type PublicationReview = {
  status: 'draft' | 'review' | 'published' | 'blocked';
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
};
export type Georeference = {
  gcps: Gcp[];
  polygon: [number, number][];
  rmse?: number;
  review?: PublicationReview;
};
export type InventoryRow = {
  fileName: string;
  size?: number;
  kind?: FileKind;
  modifiedAt?: string;
  status?: string;
};

export function detectSignature(buffer: Buffer): FileKind {
  if (!buffer.length || buffer.every((byte) => byte === 0)) return 'all-zero';
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) return 'tiff';
  return 'corrupt';
}

export const isSafeSourceName = (name: string) =>
  Boolean(name) &&
  name === name.split(/[\\/]/).pop() &&
  !name.includes('..') &&
  !name.includes('\0');

export const filterInventory = <T extends { fileName: string }>(items: T[], query: string) =>
  items.filter((item) => item.fileName.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

export const enqueue = (current: string[], requested: string[], limit: number) =>
  [...new Set([...current, ...requested])].slice(0, Math.max(0, limit));

export function planAnalysisBatch(
  files: { fileName: string; kind?: FileKind }[],
  tasks: { fileName: string; status: string }[],
) {
  const unavailable = new Set(
    tasks
      .filter((task) => task.status === 'done' || task.status === 'queued' || task.status === 'running')
      .map((task) => task.fileName),
  );
  return files
    .filter((file) => file.kind === 'pdf' || file.kind === 'jpeg' || file.kind === 'tiff' || file.kind === 'png')
    .map((file) => file.fileName)
    .filter((fileName) => !unavailable.has(fileName));
}

const orientation = (a: [number, number], b: [number, number], c: [number, number]) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function segmentsCross(a: [number, number], b: [number, number], c: [number, number], d: [number, number]) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function isSimpleValidPolygon(polygon: [number, number][]) {
  if (polygon.length < 3) return false;
  if (
    polygon.some(([longitude, latitude]) =>
      !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90,
    )
  )
    return false;

  const area = Math.abs(
    polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2,
  );
  if (area <= Number.EPSILON) return false;

  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (let j = i + 1; j < polygon.length; j += 1) {
      if (j === i || j === i + 1 || (i === 0 && j === polygon.length - 1)) continue;
      const c = polygon[j];
      const d = polygon[(j + 1) % polygon.length];
      if (segmentsCross(a, b, c, d)) return false;
    }
  }
  return true;
}

function hasDistributedGcps(gcps: Gcp[]) {
  if (gcps.length < 3) return false;
  const xValues = gcps.map((gcp) => gcp.x);
  const yValues = gcps.map((gcp) => gcp.y);
  if (Math.max(...xValues) - Math.min(...xValues) < 100) return false;
  if (Math.max(...yValues) - Math.min(...yValues) < 100) return false;

  for (let i = 0; i < gcps.length - 2; i += 1) {
    for (let j = i + 1; j < gcps.length - 1; j += 1) {
      for (let k = j + 1; k < gcps.length; k += 1) {
        if (
          Math.abs(
            orientation([gcps[i].x, gcps[i].y], [gcps[j].x, gcps[j].y], [gcps[k].x, gcps[k].y]),
          ) > 1
        )
          return true;
      }
    }
  }
  return false;
}

export function canPublishBoundary(value: Pick<Georeference, 'gcps' | 'polygon'>) {
  const reliable = value.gcps.filter(
    (gcp) =>
      gcp.reliable &&
      Number.isFinite(gcp.x) &&
      Number.isFinite(gcp.y) &&
      Number.isFinite(gcp.longitude) &&
      Number.isFinite(gcp.latitude),
  );

  return (
    reliable.length >= 3 &&
    new Set(reliable.map((gcp) => `${gcp.longitude},${gcp.latitude}`)).size >= 3 &&
    hasDistributedGcps(reliable) &&
    isSimpleValidPolygon(value.polygon)
  );
}