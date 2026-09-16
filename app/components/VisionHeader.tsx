'use client';

import React from 'react';

export function VisionHeader() {
  return (
    <header className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white mb-4">
      <div className="max-w-[--vh] mx-auto px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">

        {/* Title */}
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span>👁️</span> Vision AI Dashboard
          </h1>
          <p className="text-xs text-teal-100 ml-[--gap]">Extraction de texte, icônes et repères SIG</p>
        </div>

        {/* Version */}
        <div className="text-right">
          <span className="text-xs bg-black/20 px-2 py-1 rounded">v1.0</span>
          <p className="text-[--teal] text-xs mt-0.5 opacity-80">Codex + SIG</p>
        </div>

      </div>
    </header>
  );
}
