'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { IconsBadge } from './IconsBadge';
import { Landmarks } from './Landmarks';
import { LegendBlock } from './LegendBlock';
import { AdminInfoCard } from './AdminInfoCard';
import { StreetList } from './StreetList';

interface FileCardProps {
  file: any;
}

export function FileCard({ file }: FileCardProps) {
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition">
      {/* Header */}
      <header>
        <h3 className="font-mono text-sm text-gray-700 truncate" title={file.fileName}>{file.fileName}</h3>
        <span className="text-xs text-gray-400">Traitement</span>
      </header>

      {/* Status */}
      <div className="mb-2 pb-2 border-b">{file.status && <StatusBadge status={file.status} />}</div>

      {/* Admin Info */}
      {file.administrative && (
        <AdminInfoCard 
          wilaya={file.administrative.wilaya}
          daira_or_ca={file.administrative.daira_or_ca}
          commune={file.administrative.commune}
        />
      )}

      {/* Icons */}
      {file.icons && <IconsBadge icons={file.icons} />}

      {/* Landmarks */}
      {file.landmarks && file.landmarks.length > 0 && (
        <div className="mt-2">
          <Landmarks landmarks={file.landmarks} />
        </div>
      )}

      {/* Streets */}
      {file.streets && file.streets.length > 0 && (
        <div className="mt-1 px-2 py-1 bg-gray-50 rounded text-xs">
          <strong>Rues:</strong>{' '}
          <StreetList streets={file.streets} />
        </div>
      )}

      {/* Legends */}
      {file.legends && file.legends.length > 0 && (
        <div className="mt-1 flex items-center gap-2">
          <strong>Légendes :</strong>{' '}
          <LegendBlock legends={file.legends} />
        </div>
      )}

      {/* Empty state */}
      {!file.icons && !file.landmarks && !file.streets && (
        <p className="text-xs text-gray-400">Aucune donnée extraite</p>
      )}
    </div>
  );
}
