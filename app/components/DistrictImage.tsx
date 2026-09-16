'use client';

import React from 'react';

// Aperçu image croquis avec overlay icônes détectées mosquée/école/administration
interface DistrictPreview {
  image: string | File;
  icons?: Array<{ type: string; name: string }>;
}

export function DistrictImage({ district }: { district: DistrictPreview }) {
  return null;
}
