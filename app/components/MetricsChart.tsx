'use client';

import React from 'react';

type Metric = 'done' | 'running' | 'failed' | 'total';

export function MetricsChart({ metrics }: { metrics: Record<Metric, number> }) {
  return null;
}
