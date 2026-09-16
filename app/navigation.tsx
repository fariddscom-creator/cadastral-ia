'use client';

import React from 'react';

// Navigation principale du Cadastre Dashboard + Footer
export function NavigationBar() {
  const routes = [
    { href: '/', label: 'Vue d\'ensemble', icon: '📊' },
    { href: '/georef', label: 'Géoréférencement', icon: '🌍' },
    { href: '/vision', label: 'Vision IA', icon: '👁️' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur border-b z-50">
      <div className="max-w-[--vh] mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🗺️</span>
          <h2 className="font-bold text-gray-800 text-sm hidden sm:block">Cadastre Dashboard</h2>
        </div>

        {/* Routes */}
        <ul className="flex items-center gap-1 overflow-hidden">
          {routes.map((route) => (
            <li key={route.href}>
              <a href={route.href} className="flex items-center gap-1.5 px-3 py-1 rounded text-sm hover:bg-blue-50 text-blue-600 transition">
                {route.icon}{route.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <footer className="text-xs text-gray-400 hidden md:block">
          API: /api · Vision IA: Codex · SIG: Google Maps
        </footer>
      </div>
    </nav>
  );
}
