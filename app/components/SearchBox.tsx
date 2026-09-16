'use client';

import React from 'react';

export function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  return <input type="search" placeholder="Rechercher district..." onChange={(e) => onSearch(e.target.value)} className="w-full p-2 border rounded"/>;
}
