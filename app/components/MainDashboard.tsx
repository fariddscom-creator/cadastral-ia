'use client';

import React from 'react';
import { VisionHeader } from './VisionHeader';

export function MainDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      {/* Vision AI Header */}
      <VisionHeader />

      {/* Dashboard Container */}
      <div className="max-w-[--vh] mx-auto space-y-6">
        
        {/* Files Grid */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>📂</span> Districts extraits
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder fichier */}
            <div className="min-h-24 rounded border border-dashed border-gray-300 bg-white" />
          </div>
        </section>

      </div>
    </main>
  );
}
