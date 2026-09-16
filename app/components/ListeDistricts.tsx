'use client';

import React, { useEffect, useState } from 'react';

type DistrictFile = {
  fileName: string;
  status: string;
  commune?: string;
};

export function ListeDistricts({ files }: { files: DistrictFile[] }) {
  const [data, setData] = useState<DistrictFile[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/dashboard/files?page=0&limit=10');
        if (response.ok) {
          const d: { files?: DistrictFile[] } = await response.json();
          setData(d?.files || []);
        }
      } catch {
        console.error('Erreur chargement dashboard');
      }
    };

    loadData();
  }, [files]);

  return (
    <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {data.map((file) => (
        <li key={file.fileName} className="border rounded p-2 text-sm">
          {file.fileName} · Status: {file.status}
        </li>
      ))}
    </ul>
  );
}
