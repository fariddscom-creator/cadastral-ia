import React from 'react';

interface LegendTextProps {
  text: string;
}

export function LegendText({ text }: LegendTextProps) {
  
  const typeStyles: Record<string, string> = {
    district_number: 'bg-amber-50 border-amber-200',
    scale: 'bg-blue-50 border-blue-200',
    north_arrow: 'bg-purple-50 border-purple-200',
    title_block: 'bg-green-50 border-green-200',
    other: 'bg-gray-50 border-gray-200',
  };
  
  return (
    <div className={`inline-block px-3 py-1 rounded text-sm ${typeStyles.other}`}>
      <code>{text}</code>
    </div>
  );
}
