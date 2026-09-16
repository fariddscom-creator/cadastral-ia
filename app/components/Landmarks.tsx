'use client';

import React from 'react';

interface LandmarksProps {
  landmarks: any[];
}

export function Landmarks({ landmarks }: LandmarksProps) {
  
  const landmarkMap: Record<string, string> = {
    stade: '🏟️',
    ambassade: '🇺🦅',
    hôtel_de_ville: '🏛️',
    mosquée: '🕌',
    mairie: '💼',
    collège: '🎒',
    lycée: '📚',
    église: '⛪',
    temple: '🕉️',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {landmarks && landmarks.slice(0, 15).map((lm: any, i: number) => (
        <div 
          key={i}
          className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded text-xs border border-indigo-100"
          title={`Type: ${lm.type}\n${lm.name || '--'}\nConfiance: ${(lm.confidence * 100).toFixed(0)}%`}
        >
          <span>{lm.name ? landmarkMap[String(lm.name).toLowerCase()] || '🏷️' : '🏷️'}</span>
          <span className={Math.round(lm.confidence * 100) + '%' as string}>• {lm.name || lm.type}</span>
        </div>
      ))}
    </div>
  );
}
