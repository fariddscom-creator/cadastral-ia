'use client';

import React from 'react';

interface AdminDistrictProps {
  wilaya: string | null;
  daira_or_ca: string | null;
  commune: string | null;
}

export function AdminInfoCard({ wilaya, daira_or_ca, commune }: AdminDistrictProps) {
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
        <span>🏛️</span> Informations administratives
      </h4>

      {wilaya && (
        <div className="text-sm py-1 border-b dashed">
          <span className="font-semibold text-gray-600">Wilaya:</span>{' '}
          <span className="text-indigo-600">{String(wilaya).padStart(3, '0')}</span>
        </div>
      )}

      {daira_or_ca && (
        <div className="text-sm py-1 border-b dashed">
          <span className="font-semibold text-gray-600">C.A./Daïra:</span>{' '}
          <span className="text-indigo-700">{String(daira_or_ca).padStart(3, '0')}</span>
        </div>
      )}

      {commune && (
        <div className="text-sm py-1">
          <span className="font-semibold text-gray-600">Commune:</span>{' '}
          <span className="font-medium text-indigo-800">{commune}</span>
        </div>
      )}

      {!wilaya && !daira_or_ca && !commune && (
        <p className="text-xs text-gray-500">Les informations administratives seront extraites du croquis.</p>
      )}
    </div>
  );
}
