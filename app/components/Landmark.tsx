import React from 'react';

interface LandmarkProps {
  landmark: { type: string; name: string | null; confidence: number } | null;
}

export function Landmark({ landmark }: LandmarkProps) {
  if (!landmark) return null;

  const icons: Record<string, React.ReactNode> = {
    stade: '🏟️',
    ambassade: '🇺🦅',
    hôpital: '🏥',
    mosquée: '🕌',
    mairie: '💼',
    collège: '🎒',
    lycée: '📚',
    église: '⛪',
    temple: '🕉️',
  };

  const emoji = landmark.name ? icons[landmark.name.toLowerCase()] || '🏷️' : '🏷️';
  
  return (
    <div 
      className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded text-xs"
      role="article"
      title={landmark.type}
    >
      <span>{emoji}</span>
      <span className={Math.round(landmark.confidence * 100) + '%'}>• {landmark.name || landmark.type}</span>
    </div>
  );
}
