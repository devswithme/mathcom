'use client';

import React from 'react';

interface PlaceholderBannerProps {
  communityId: string;
  width?: number;
  height?: number;
}

// Map of community IDs to banner colors
const communityColors: Record<string, string> = {
  cie_checkpoint: '#4F46E5', // Indigo
  cie_igcse: '#0891B2',      // Cyan
  cie_alevel: '#7F0000',     // Dark Red (matching your UI)
};

// Map of community IDs to display names
const communityNames: Record<string, string> = {
  cie_checkpoint: 'Cambridge Checkpoint',
  cie_igcse: 'Cambridge IGCSE',
  cie_alevel: 'Cambridge A-Level',
};

const PlaceholderBanner: React.FC<PlaceholderBannerProps> = ({
  communityId,
  width = 1200,
  height = 400
}) => {
  const color = communityColors[communityId] || '#6B7280';
  const name = communityNames[communityId] || communityId;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={width} height={height} fill={color} />
      <text
        x="50%"
        y="50%"
        fontFamily="Arial, sans-serif"
        fontSize="48"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name}
      </text>
      <text
        x="50%"
        y="60%"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fill="rgba(255,255,255,0.8)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Community Banner
      </text>
    </svg>
  );
};

export default PlaceholderBanner;
