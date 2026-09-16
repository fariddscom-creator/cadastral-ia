'use client';

import React from 'react';

interface GeoLocationProps {
  lat: number;
  lng: number;
  address?: string;
}

export function GeoLocation({ lat, lng, address }: GeoLocationProps) {
  const coords = [lat, lng];

  if (!address) return <div className="text-xs text-gray-400">Localisation chargée...</div>;

  const getRegionLabel = () => {
    const parts = address.split(',');
    return parts.slice(-3).join(', ') || 'Algérie';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
        📍 Géoréférencement
      </h4>

      {/* Map Placeholder */}
      <div 
        className="relative w-full aspect-video bg-gray-100 rounded mb-3 overflow-hidden group"
        style={{ 
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', 
          backgroundSize: '8px 8px' 
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
            {/* Location Pin */}
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
            {/* Pulse effect */}
            <circle cx="12" cy="12" r="8" className="animate-pulse opacity-50">
              <use href="#pulse-ring" />
            </circle>
          </svg>
        </div>

        <div className="absolute top-2 left-2 right-2 text-xs font-medium bg-white/90 rounded px-3 py-1">
          <span className="font-bold">{coords[0]}°N, {coords[1]}°E</span>
        </div>

        <span id="pulse-ring" style={{ display: 'none' }} />
      </div>

      {/* Location Info */}
      <p className="text-sm text-gray-700 font-medium mb-1">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
        {getRegionLabel()}
      </p>

      {address && (
        <div className="text-xs text-gray-500 truncate border-t pt-2" title={address}>
          {address}
        </div>
      )}
    </div>
  );
}
