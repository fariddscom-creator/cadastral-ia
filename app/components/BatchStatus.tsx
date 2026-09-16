'use client';

import React from 'react';

interface Batch {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  filesCount?: number;
}

export function BatchStatus({ batches }: { batches: Batch[] }) {
  return null;
}
