'use client';

import React, { useState } from 'react';
import { NavigationBar } from '../navigation';

export default function Visualisation() {
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <NavigationBar />

      {/* Conteneur principal */}
      <div className="max-w-[--vh] mx-auto mt-16 p-4">
        {/* Titre du dashboard */}
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Cadastre Dashboard Vision AI v1.0</h1>
          <span className="text-xs bg-blue-100 px-2 py-1 rounded">v1.0 · Google Maps API</span>
        </header>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          {/* Vue 2D (Google Maps) ou liste des districts */}
          {activeView === 'map' ? (
            <MapView />
          ) : (
            <ListView />
          )}
        </div>
      </div>
    </main>
  );
}

function MapView() {
  // Vue Google Maps pour visualiser les icônes détectées
  return null;
}

function ListView() {
  // Vue liste des districts avec données d'extraction Vision AI
  return <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4">...</ul>;
}
