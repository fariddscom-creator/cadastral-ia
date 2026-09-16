'use client';

import React from 'react';

interface ExtractStatsCardProps {
  iconCount: number;
  landmarkCount: number;
  streetCount: number;
  legendCount: number;
}

export function ExtractStatsCard({ iconCount, landmarkCount, streetCount, legendCount }: ExtractStatsCardProps) {
  
  const getColor = (value: number): 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' => {
    if (value === 0) return 'bg-red-500';
    if (value < 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const stats = [
    ['Icones', iconCount, getColor(iconCount)],
    ['Reperes', landmarkCount, getColor(landmarkCount)],
    ['Rues', streetCount, getColor(streetCount)],
    ['Legendes', legendCount, getColor(legendCount)],
  ] as const;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg p-4 text-white shadow-lg">
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span>📊</span> Statistiques d'extraction
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(([label, value, color]) => (
          <div key={label} className="flex items-center gap-2 rounded bg-white/10 px-2 py-1 text-xs">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span>{label}</span>
            <span className="ml-auto font-bold">{value}</span>
          </div>
        ))}

        <div className="col-span-2 flex items-center gap-1.5 bg-green-700/30 rounded px-2 py-1 text-xs">
          ✓ Extraction complète : 
          <span className="font-bold">{iconCount + landmarkCount + streetCount + legendCount} éléments</span>
        </div>
      </div>
    </div>
  );
}
