'use client';

import React from 'react';

interface StreetListProps {
  streets: string[];
}

export function StreetList({ streets }: StreetListProps) {
  
  const groupedStreets = React.useMemo(() => {
    return streets.slice(0, 15);
  }, [streets]);

  return (
    <div className="text-xs overflow-hidden">
      <ul className="space-y-0.5">
        {groupedStreets.map((street) => (
          <li 
            key={street} 
            className="truncate text-gray-600 hover:bg-blue-50 rounded px-1"
            title={street}
          >
            {street}
          </li>
        ))}
      </ul>
      {streets.length > 15 && (
        <div className="text-gray-400 mt-1">+ {(streets.length - 15).toLocaleString()} autres...</div>
      )}
    </div>
  );
}
