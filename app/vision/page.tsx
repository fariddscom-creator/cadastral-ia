'use client';

import React from 'react';

// Page Vision AI → affichage des résultats d'extraction Vision IA
export default function VisionPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-3 flex items-center gap-2">
        <h1 className="text-lg font-bold">Vision AI Extraction</h1>
      </header>
      
      <div className="max-w-[--vh] mx-auto p-4">
        {/* TODO: Afficher les résultats d'extractions Vision IA */}
        <p className="text-gray-500">Résultats d'extraction Vision IA...</p>
      </div>
    </main>
  );
}
