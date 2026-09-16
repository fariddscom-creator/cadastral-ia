'use client';

import React from 'react';

interface WarningAlertProps {
  warnings: string[];
}

export function WarningAlert({ warnings }: WarningAlertProps) {
  
  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded p-3">
      <h5 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
        ⚠️ Avertissements ({warnings.length})
      </h5>

      <ul className="space-y-0.5 text-xs text-amber-800 ml-7">
        {warnings.map((warning, i) => (
          <li key={i} role="alert">
            • {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}
