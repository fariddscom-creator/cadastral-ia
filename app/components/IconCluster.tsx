'use client';

import React from 'react';

interface Icon {
  type: string;
  name: string | null;
}

interface IconClusterProps {
  icons: Icon[];
}

export function IconCluster({ icons }: IconClusterProps) {
  
  const iconCounts = icons.reduce((acc, icon) => {
    acc[icon.type] ??= { type: icon.type, count: 0, names: new Set() };
    acc[icon.type].count++;
    if (icon.name && icon.name.length > 2) {
      acc[icon.type].names.add(icon.name);
    }
    return acc;
  }, {} as Record<string, { type: string; count: number; names: Set<string> }>);

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(iconCounts).map(({ type, count, names }) => (
        <div key={type} className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={`${count} ${type}`} title={`${count} × ${type}`}>
            {count > 0 && ['mosque', 'school'].some(t => t === type) ? '🕌' : 
             ['administration', 'mairie', 'hopital'].some(t => t === type) ? '🏛️' : 
             count}
          </span>
          {names.size > 0 && (
            <div className="text-xs bg-gray-50 px-2 py-1 rounded">
              {Array.from(names).slice(0, 3).join(', ')}
              {names.size > 3 && ` + ${names.size - 3}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
