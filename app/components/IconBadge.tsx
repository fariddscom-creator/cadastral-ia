import React from 'react';

interface IconBadgeProps {
  icon: { type: string; name: string | null } | null;
}

export function IconBadge({ icon }: IconBadgeProps) {
  if (!icon) return null;

  const icons: Record<string, React.ReactNode> = {
    mosque: <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs">🕌</div>,
    school: <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">🏫</div>,
    administration: <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">🏛️</div>,
    hospital: <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">🏥</div>,
    cemetery: <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">⚰️</div>,
    market: <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-xs">🛒</div>,
    stadium: <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">⚽</div>,
    other: <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">▫️</div>,
  };

  return (
    <div title={`Type: ${icon.type}\n${icon.name || '—'}`}>
      {icons[icon.type] || icons.other}
    </div>
  );
}
