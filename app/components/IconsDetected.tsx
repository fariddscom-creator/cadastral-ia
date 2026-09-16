'use client';

import React from 'react';

// Composant qui affiche les icônes détectées SIG (mosquée, école, administration)
interface Icon {
  type: string;
  name?: string;
}

export function IconsDetected({ icons }: { icons: Icon[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {icons.map((icon, index) => (
        <li key={`${icon.type}-${icon.name || index}`} className="rounded border px-2 py-1 text-xs">
          {icon.type}
          {icon.name ? ` - ${icon.name}` : ''}
        </li>
      ))}
    </ul>
  );
}
