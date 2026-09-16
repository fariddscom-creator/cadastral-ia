import type { InventoryRow } from './core';
import type { StoredGeoreference } from './export';

export type GeoreferenceFileView = InventoryRow & {
  georeference: {
    status: 'not_available' | 'provisional';
    candidateCount: number;
    gcpCount: number;
    maxDistanceMeters: number | null;
  };
};

/** Never manufactures a point: only stored provisional candidates are exposed. */
export function buildGeoreferenceFileViews(files: InventoryRow[], georeferences: Record<string, StoredGeoreference>): GeoreferenceFileView[] {
  return files.map((file) => {
    const georeference = georeferences[file.fileName];
    return {
      ...file,
      georeference: {
        status: georeference?.status || 'not_available',
        candidateCount: georeference?.evidence.length || 0,
        gcpCount: 0,
        maxDistanceMeters: georeference?.maxDistanceMeters ?? null,
      },
    };
  });
}
