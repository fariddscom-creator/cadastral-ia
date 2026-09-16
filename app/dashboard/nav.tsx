'use client';

import React from 'react';

// Navigation principale du Cadastre Dashboard
const NAV_ITEMS = [
  { href: '/', label: 'Vue d\'ensemble', icon: '📊' },
  { href: '/georef', label: 'Géoréférencement', icon: '📍' },
  { href: '/vision', label: 'Vision IA', icon: '👁️' },
];

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur border-b z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <h1 className="font-bold text-gray-800 text-sm hidden sm:block">Cadastre Dashboard</h1>
          </div>

          {/* Nav Items */}
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm hover:bg-blue-50 text-blue-600">
                  {item.icon}{item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Version */}
          <div className="text-xs text-gray-400 hidden md:block">v1.0</div>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        {['API: /api', 'Vision IA: Codex', 'SIG: Google Maps'].map((txt, i) => (
          <span key={i} className="hidden sm:inline">{txt}</span>
        ))}
      </div>
    </footer>
  );
}
