'use client';

import React from 'react';

interface LegendBlockProps {
  legends: any[];
}

const LEGEND_TYPES = {
  district_number: { bg: 'bg-amber-50', border: 'border-yellow-200', text: 'text-amber-900' },
  scale: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  north_arrow: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
};

export function LegendBlock({ legends }: LegendBlockProps) {
  
  if (!legends?.length) return null;

  return (
    <div className="ml-1">
      <ul className="space-y-0.5 flex flex-wrap gap-1">
        {legends.slice(0, 8).map((leg: any, i: number) => {
          const style = LEGEND_TYPES[leg.type as keyof typeof LEGEND_TYPES] || { bg: 'bg-gray-50' };
          
          return (
            <li key={i} className={`${style.bg} ${style.border} border rounded px-2 py-0.5 text-xs flex items-center gap-1.5`}>
              <code className={`text-sm font-mono ${style.text}`} title={leg.text}>{leg.text}</code>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
