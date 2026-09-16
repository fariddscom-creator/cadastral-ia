'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  
  const getStyles = (s: string): ['bg-gray-100', 'text-gray-600'] | 
                         ['bg-blue-50', 'text-blue-700'] | 
                         ['bg-green-50', 'text-green-700'] | 
                         ['bg-red-50', 'text-red-700'] => {
    const lower = s.toLowerCase();
    if (['queued', 'pending'].some(x => lower.includes(x))) return ['bg-gray-100', 'text-gray-600'];
    if (['running', 'processing'].some(x => lower.includes(x))) return ['bg-blue-50', 'text-blue-700'];
    if (['done', 'complete', 'success'].some(x => lower.includes(x))) return ['bg-green-50', 'text-green-700'];
    if (['failed', 'error', 'fail'].some(x => lower.includes(x))) return ['bg-red-50', 'text-red-700'];
    return ['bg-gray-100', 'text-gray-600'];
  };

  const [bg, text] = getStyles(status);
  
  const statusLabel: Record<string, string> = {
    queued: 'En file d\'attente',
    pending: 'En attente...',
    running: 'Extraction IA…',
    processing: 'Traitement en cours',
    done: 'Complet ✓',
    complete: 'Terminé',
    success: 'Succès',
    failed: 'Échoué ✗',
    error: 'Erreur',
  };

  const label = statusLabel[status] || '—';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {status === 'running' && <span className="animate-spin">⏳</span>}
      {status === 'done' && <span>✓</span>}
      {label}
    </span>
  );
}
