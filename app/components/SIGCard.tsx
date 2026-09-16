'use client';

import React from 'react';

interface District {
  id: string;
  lat: number;
  lng: number;
  districtNumber: string;
  wilaya?: number;
}

export function SIGMapDisplay({ districts }: { districts: District[] }) {
  return <div className="w-full aspect-video bg-green-100"></div>;
}
