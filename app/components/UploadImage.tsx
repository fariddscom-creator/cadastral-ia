'use client';

import React, { useRef } from 'react';

interface UploadImageProps {
  onFileSelect: (file: File) => void;
}

export function UploadImage({ onFileSelect }: UploadImageProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={fileInput}
      type="file"
      accept=".png,.jpg,.jpeg,.tiff"
      onChange={(e) => {
        if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
      }}
    />
  );
}
