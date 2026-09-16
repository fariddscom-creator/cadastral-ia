'use client';

import React from 'react';

interface GeolocationSummaryProps {
  lat?: number;
  lng?: number;
  address: string;
}

export function GeolocationSummary({ lat, lng, address }: GeolocationSummaryProps) {
  
  // Format the coordinates for display
  const formattedCoords = lat && lng 
    ? `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`
    : 'En attente de géoréférencement…';

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 shadow-sm">
      <h4 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-2">
        <span>📍</span> Position du district
      </h4>

      {/* Coordinates Display */}
      <div className="flex items-center justify-between bg-white rounded px-3 py-1.5 border border-indigo-100 mb-2">
        <span className="text-xs font-mono text-indigo-600">{formattedCoords}</span>
        {lat && lng && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-gray-500">GPS fixe</span>
          </div>
        )}
      </div>

      {/* Address Info */}
      <p className="text-sm text-gray-700 line-clamp-2" title={address}>
        {address}
      </p>
    </div>
  );
}
