'use client';

import React from 'react';
import { NavigationBar } from '../navigation';

export default function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
      {/* Navigation */}

      <NavigationBar />
      {/* Contenu central */}

      {children}
    </div>
  );
}
