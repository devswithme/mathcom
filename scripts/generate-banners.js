const fs = require('fs');
const path = require('path');

// Community configurations
const communities = [
  {
    id: 'cie_checkpoint',
    name: 'Cambridge Checkpoint',
    color: '#4F46E5' // Indigo
  },
  {
    id: 'cie_igcse',
    name: 'Cambridge IGCSE',
    color: '#0891B2' // Cyan
  },
  {
    id: 'cie_alevel',
    name: 'Cambridge A-Level',
    color: '#7F0000' // Dark Red
  }
];

// Banner dimensions
const width = 1200;
const height = 400;

// Ensure the directory exists
const bannerDir = path.join(__dirname, '../public/community_banners');
if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
}

// Generate SVG banner for each community
communities.forEach(community => {
  const svgContent = `<svg 
    width="${width}" 
    height="${height}" 
    viewBox="0 0 ${width} ${height}" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="${width}" height="${height}" fill="${community.color}" />
    <text
      x="50%"
      y="50%"
      font-family="Arial, sans-serif"
      font-size="48"
      font-weight="bold"
      fill="white"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      ${community.name}
    </text>
    <text
      x="50%"
      y="60%"
      font-family="Arial, sans-serif"
      font-size="24"
      fill="rgba(255,255,255,0.8)"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      Community Banner
    </text>
  </svg>`;

  const filePath = path.join(bannerDir, `${community.id}_banner.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Generated banner for ${community.name} at ${filePath}`);
});

// Generate a default banner
const defaultSvgContent = `<svg 
  width="${width}" 
  height="${height}" 
  viewBox="0 0 ${width} ${height}" 
  xmlns="http://www.w3.org/2000/svg"
>
  <rect width="${width}" height="${height}" fill="#6B7280" />
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="48"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
  >
    MathCom Community
  </text>
  <text
    x="50%"
    y="60%"
    font-family="Arial, sans-serif"
    font-size="24"
    fill="rgba(255,255,255,0.8)"
    text-anchor="middle"
    dominant-baseline="middle"
  >
    Default Banner
  </text>
</svg>`;

const defaultFilePath = path.join(bannerDir, 'default_banner.svg');
fs.writeFileSync(defaultFilePath, defaultSvgContent);
console.log(`Generated default banner at ${defaultFilePath}`);

console.log('All banners generated successfully!');
