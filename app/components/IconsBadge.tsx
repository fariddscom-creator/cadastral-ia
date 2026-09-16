'use client';

import React from 'react';

type IconType = keyof typeof ICON_EMOJIS;

interface IconItem {
  type?: string;
  name?: string | null;
  pixel?: unknown[];
}

interface IconsBadgeProps {
  icons: IconItem[];
}

const ICON_EMOJIS = {
  mosque: '🕌',
  school: '🏫',
  administration: '🏛️',
  hospital: '🏥',
  cemetery: '⚰️',
  market: '🛒',
  stadium: '⚽',
  other: '▫️',
};

export function IconsBadge({ icons }: IconsBadgeProps) {
  
  if (!icons?.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {icons.slice(0, 20).map((icon, i) => {
        const iconType = (icon.type && icon.type in ICON_EMOJIS ? icon.type : 'other') as IconType;
        const emoji = ICON_EMOJIS[iconType];
        const hasSignal = Boolean(icon.name || (icon.pixel?.length ?? 0) > 0);
        
        return (
          <div 
            key={i} 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              iconType === 'mosque' ? 'bg-teal-100' :
              iconType === 'school' ? 'bg-blue-100' :
              iconType === 'administration' ? 'bg-purple-100' : 'bg-gray-100'
            }`}
            title={`${iconType}: ${icon.name || emoji}`}
          >
            {hasSignal ? emoji : '0'}
          </div>
        );
      })}
    </div>
  );
}
