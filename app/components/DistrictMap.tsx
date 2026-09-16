'use client';

import React from 'react';

// Carte interactive d'un district avec icônes détectées SIG (mosquée, école, administration)
interface District {
  fileName: string;
  lat?: number;
  lng?: number;
}

export function DistrictMap({ districts }: { districts: District[] }) {
  return <div className="w-full aspect-video bg-green-50"></div>;
}
