'use client';

import React, { useState } from 'react';
import { FileCard } from '../components/FileCard';

type DashboardFile = {
  fileName: string;
  status: string;
};

export default function Page() {
  const [files, setFiles] = useState<DashboardFile[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/dashboard/files?page=0&limit=10');
        if (response.ok) {
          const data: any = await response.json();
          setFiles(data?.files || []);
        }
      } catch (err) {
        console.error('Erreur:', err);
      }
    };

    loadData();
    
    return () => {};
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
      {/* Header */}
      <header className="max-w-[--vh] mx-auto mb-6">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Vue d'ensemble des districts</h1>
        <p className="text-sm text-gray-500">{files.length} fichiers chargés</p>
      </header>

      {/* Empty state */}
      {files.length === 0 && (
        <div className="max-w-[--vh] mx-auto text-center py-32">
          <span className="text-6xl mb-4 block">📂</span>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Aucune donnée affichée</h2>
        </div>
      )}

      {/* Grid de Fichiers */}
      {files.length > 0 && (
        <div className="max-w-[--vh] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <FileCard key={file.fileName} file={file as any} />
          ))}
        </div>
      )}
    </main>
  );
}
