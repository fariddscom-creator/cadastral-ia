'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';

interface File {
  fileName: string;
  status: string;
}

interface InventoryGridProps {
  files: File[];
  onFileClick: (file: File) => void;
}

export function InventoryGrid({ files, onFileClick }: InventoryGridProps) {
  
  if (!files.length) return <div className="text-center text-gray-500 mt-24">Aucune donnée</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Vue d'ensemble des districts</h1>
        <span className="text-sm text-gray-500">{files.length} fichiers traités</span>
      </header>

      {/* Grid de Fichiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map(file => (
          <button 
            key={file.fileName}
            onClick={() => onFileClick({ fileName: file.fileName, status: file.status })}
            className="bg-white rounded-lg shadow-sm border hover:border-blue-300 transition text-left"
          >
            <div className="p-4">
              {/* Nom du fichier */}
              <p className="font-mono text-xs text-gray-600 truncate">{file.fileName}</p>

              {/* Statut */}
              <StatusBadge status={file.status} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
