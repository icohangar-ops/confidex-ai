import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const WIDTH = 1440;
const HEIGHT = 720;
const outputPath = '/home/z/my-project/confidex-ai/docs/demo/thumbnail.png';

// Color palette
const NAVY_DARK = '#0a0e27';
const NAVY_MID = '#111638';
const SLATE = '#1a1f3a';
const EMERALD = '#00ffa3';
const TEAL = '#0ff';
const TEAL_DARK = '#10b981';
const WHITE = '#ffffff';
const TEAL_GLOW = '#00ffa3';

function buildSVG() {
  // Gradient defs
  const defs = `
    <defs>
      <!-- Background gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${NAVY_DARK}" />
        <stop offset="50%" stop-color="${NAVY_MID}" />
        <stop offset="100%" stop-color="${SLATE}" />
      </linearGradient>
      <!-- Shield gradient -->
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d2b3e" />
        <stop offset="100%" stop-color="#0a1628" />
      </linearGradient>
      <!-- Emerald glow gradient -->
      <radialGradient id="glowEmerald" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${EMERALD}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="${EMERALD}" stop-opacity="0" />
      </radialGradient>
      <!-- Teal glow -->
      <radialGradient id="glowTeal" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${TEAL}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="${TEAL}" stop-opacity="0" />
      </radialGradient>
      <!-- Large center glow -->
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="35%">
        <stop offset="0%" stop-color="${EMERALD}" stop-opacity="0.15" />
        <stop offset="60%" stop-color="#006644" stop-opacity="0.05" />
        <stop offset="100%" stop-color="transparent" stop-opacity="0" />
      </radialGradient>
      <!-- Shield border gradient -->
      <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${EMERALD}" />
        <stop offset="50%" stop-color="${TEAL}" />
        <stop offset="100%" stop-color="${EMERALD}" />
      </linearGradient>
      <!-- Lock body gradient -->
      <linearGradient id="lockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${EMERALD}" />
        <stop offset="100%" stop-color="${TEAL_DARK}" />
      </linearGradient>
      <!-- Data stream gradient -->
      <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${TEAL}" stop-opacity="0" />
        <stop offset="30%" stop-color="${TEAL}" stop-opacity="0.6" />
        <stop offset="70%" stop-color="${EMERALD}" stop-opacity="0.6" />
        <stop offset="100%" stop-color="${EMERALD}" stop-opacity="0" />
      </linearGradient>
      <!-- Text glow filter -->
      <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <!-- Soft glow filter -->
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <!-- Node glow -->
      <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <!-- Grid pattern -->
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${EMERALD}" stroke-width="0.3" stroke-opacity="0.08" />
      </pattern>
    </defs>
  `;

  // Background
  const background = `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)" />
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" />
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#centerGlow)" />
  `;

  // Bokeh circles
  const bokeh = `
    <circle cx="200" cy="150" r="80" fill="${TEAL}" opacity="0.03" />
    <circle cx="1200" cy="550" r="100" fill="${EMERALD}" opacity="0.04" />
    <circle cx="700" cy="100" r="60" fill="${TEAL}" opacity="0.03" />
    <circle cx="350" cy="600" r="70" fill="${EMERALD}" opacity="0.03" />
    <circle cx="1100" cy="200" r="50" fill="${TEAL}" opacity="0.02" />
    <circle cx="100" cy="400" r="40" fill="${EMERALD}" opacity="0.03" />
    <circle cx="1300" cy="400" r="55" fill="${TEAL}" opacity="0.03" />
  `;

  // Data streams (encrypted binary flowing left to right)
  const dataStreams = [];
  const streamYs = [280, 320, 360, 400, 440, 480];
  for (const y of streamYs) {
    const x1 = 80 + Math.random() * 100;
    const x2 = WIDTH - 80 - Math.random() * 100;
    dataStreams.push(`
      <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="url(#streamGrad)" stroke-width="1" opacity="0.25" />
    `);
  }
  
  // Binary text particles along streams
  const binaryParticles = [];
  for (const y of streamYs) {
    for (let i = 0; i < 12; i++) {
      const x = 100 + i * 105 + Math.random() * 30;
      const text = Math.random() > 0.5 ? '1' : '0';
      const opacity = 0.15 + Math.random() * 0.2;
      binaryParticles.push(`
        <text x="${x}" y="${y - 3}" fill="${TEAL}" font-family="monospace" font-size="9" opacity="${opacity}">${text}</text>
        <text x="${x + 8}" y="${y - 3}" fill="${TEAL}" font-family="monospace" font-size="9" opacity="${opacity}">${Math.random() > 0.5 ? '1' : '0'}</text>
        <text x="${x + 16}" y="${y - 3}" fill="${TEAL}" font-family="monospace" font-size="9" opacity="${opacity}">${Math.random() > 0.5 ? '1' : '0'}</text>
      `);
    }
  }

  // Blockchain nodes and chain links
  const blockchain = `
    <!-- Left side nodes -->
    <g filter="url(#nodeGlow)">
      <circle cx="120" cy="350" r="6" fill="${TEAL}" opacity="0.7" />
      <circle cx="180" cy="310" r="5" fill="${EMERALD}" opacity="0.5" />
      <circle cx="200" cy="420" r="7" fill="${TEAL}" opacity="0.6" />
      <circle cx="150" cy="480" r="4" fill="${EMERALD}" opacity="0.4" />
      <circle cx="250" cy="380" r="5" fill="${TEAL}" opacity="0.5" />
    </g>
    <!-- Left side chain links -->
    <line x1="120" y1="350" x2="180" y2="310" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <line x1="180" y1="310" x2="250" y2="380" stroke="${TEAL}" stroke-width="1.5" opacity="0.25" />
    <line x1="120" y1="350" x2="200" y2="420" stroke="${TEAL}" stroke-width="1.5" opacity="0.25" />
    <line x1="200" y1="420" x2="150" y2="480" stroke="${TEAL}" stroke-width="1.5" opacity="0.2" />
    <line x1="200" y1="420" x2="250" y2="380" stroke="${TEAL}" stroke-width="1.5" opacity="0.2" />
    
    <!-- Right side nodes -->
    <g filter="url(#nodeGlow)">
      <circle cx="1280" cy="340" r="6" fill="${TEAL}" opacity="0.7" />
      <circle cx="1220" cy="300" r="5" fill="${EMERALD}" opacity="0.5" />
      <circle cx="1250" cy="430" r="7" fill="${TEAL}" opacity="0.6" />
      <circle cx="1300" cy="480" r="4" fill="${EMERALD}" opacity="0.4" />
      <circle cx="1180" cy="390" r="5" fill="${TEAL}" opacity="0.5" />
    </g>
    <!-- Right side chain links -->
    <line x1="1280" y1="340" x2="1220" y2="300" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <line x1="1220" y1="300" x2="1180" y2="390" stroke="${TEAL}" stroke-width="1.5" opacity="0.25" />
    <line x1="1280" y1="340" x2="1250" y2="430" stroke="${TEAL}" stroke-width="1.5" opacity="0.25" />
    <line x1="1250" y1="430" x2="1300" y2="480" stroke="${TEAL}" stroke-width="1.5" opacity="0.2" />
    <line x1="1250" y1="430" x2="1180" y2="390" stroke="${TEAL}" stroke-width="1.5" opacity="0.2" />
  `;

  // Hexagonal shield with lock
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 + 20;
  const shieldSize = 130;
  
  // Hexagon points
  const hexPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = cx + shieldSize * Math.cos(angle);
    const py = cy + shieldSize * Math.sin(angle);
    hexPoints.push(`${px},${py}`);
  }
  
  // Outer glow for shield
  const shieldGlow = `
    <ellipse cx="${cx}" cy="${cy}" rx="160" ry="160" fill="url(#glowEmerald)" opacity="0.6" />
  `;

  // Shield body
  const shield = `
    <polygon points="${hexPoints.join(' ')}" fill="url(#shieldGrad)" stroke="url(#shieldBorder)" stroke-width="3" opacity="0.9" />
  `;

  // Shield inner hexagon (decorative)
  const innerHexPoints = [];
  const innerSize = shieldSize * 0.75;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = cx + innerSize * Math.cos(angle);
    const py = cy + innerSize * Math.sin(angle);
    innerHexPoints.push(`${px},${py}`);
  }
  const innerShield = `
    <polygon points="${innerHexPoints.join(' ')}" fill="none" stroke="${TEAL}" stroke-width="0.5" opacity="0.25" />
  `;

  // Circuitry lines on shield
  const circuitry = `
    <line x1="${cx - 80}" y1="${cy - 30}" x2="${cx - 20}" y2="${cy - 30}" stroke="${TEAL}" stroke-width="0.5" opacity="0.2" />
    <line x1="${cx - 20}" y1="${cy - 30}" x2="${cx - 20}" y2="${cy - 60}" stroke="${TEAL}" stroke-width="0.5" opacity="0.2" />
    <line x1="${cx + 20}" y1="${cy + 30}" x2="${cx + 80}" y2="${cy + 30}" stroke="${TEAL}" stroke-width="0.5" opacity="0.2" />
    <line x1="${cx + 20}" y1="${cy + 30}" x2="${cx + 20}" y2="${cy + 60}" stroke="${TEAL}" stroke-width="0.5" opacity="0.2" />
    <line x1="${cx - 60}" y1="${cy + 10}" x2="${cx - 30}" y2="${cy + 10}" stroke="${TEAL}" stroke-width="0.5" opacity="0.15" />
    <line x1="${cx + 30}" y1="${cy - 10}" x2="${cx + 60}" y2="${cy - 10}" stroke="${TEAL}" stroke-width="0.5" opacity="0.15" />
    <circle cx="${cx - 20}" cy="${cy - 60}" r="3" fill="${TEAL}" opacity="0.2" />
    <circle cx="${cx + 20}" cy="${cy + 60}" r="3" fill="${TEAL}" opacity="0.2" />
  `;

  // Lock icon in center of shield
  const lockX = cx;
  const lockY = cy;
  const lock = `
    <g filter="url(#softGlow)">
      <!-- Lock shackle (U-shape) -->
      <path d="M ${lockX - 22} ${lockY - 5} 
               L ${lockX - 22} ${lockY - 25} 
               A 22 22 0 0 1 ${lockX + 22} ${lockY - 25} 
               L ${lockX + 22} ${lockY - 5}" 
            fill="none" stroke="${EMERALD}" stroke-width="5" stroke-linecap="round" opacity="0.9" />
      <!-- Lock body -->
      <rect x="${lockX - 30}" y="${lockY - 5}" width="60" height="45" rx="5" fill="url(#lockGrad)" opacity="0.9" />
      <!-- Keyhole -->
      <circle cx="${lockX}" cy="${lockY + 12}" r="7" fill="${NAVY_DARK}" opacity="0.8" />
      <rect x="${lockX - 3}" y="${lockY + 14}" width="6" height="14" rx="2" fill="${NAVY_DARK}" opacity="0.8" />
      <!-- Keyhole inner dot -->
      <circle cx="${lockX}" cy="${lockY + 12}" r="3" fill="${TEAL}" opacity="0.5" />
    </g>
  `;

  // AI Brain icon (upper left area)
  const brainX = 160;
  const brainY = 180;
  const brain = `
    <g transform="translate(${brainX}, ${brainY})" filter="url(#nodeGlow)">
      <!-- Brain outer shape using overlapping circles/paths -->
      <ellipse cx="0" cy="0" rx="40" ry="30" fill="none" stroke="${TEAL}" stroke-width="1.5" opacity="0.4" />
      <ellipse cx="-5" cy="-2" rx="22" ry="18" fill="none" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <!-- Neural network nodes -->
      <circle cx="-15" cy="-12" r="4" fill="${TEAL}" opacity="0.8" />
      <circle cx="0" cy="-18" r="3.5" fill="${EMERALD}" opacity="0.7" />
      <circle cx="15" cy="-12" r="4" fill="${TEAL}" opacity="0.8" />
      <circle cx="-20" cy="5" r="3.5" fill="${EMERALD}" opacity="0.7" />
      <circle cx="0" cy="0" r="5" fill="${TEAL}" opacity="0.9" />
      <circle cx="20" cy="5" r="3.5" fill="${EMERALD}" opacity="0.7" />
      <circle cx="-10" cy="18" r="3" fill="${TEAL}" opacity="0.6" />
      <circle cx="10" cy="18" r="3" fill="${EMERALD}" opacity="0.6" />
      <!-- Connections -->
      <line x1="-15" y1="-12" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="0" y1="-18" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="15" y1="-12" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="-20" y1="5" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="20" y1="5" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="-10" y1="18" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="10" y1="18" x2="0" y2="0" stroke="${TEAL}" stroke-width="1" opacity="0.3" />
      <line x1="-15" y1="-12" x2="0" y2="-18" stroke="${TEAL}" stroke-width="0.8" opacity="0.2" />
      <line x1="0" y1="-18" x2="15" y2="-12" stroke="${TEAL}" stroke-width="0.8" opacity="0.2" />
      <line x1="-15" y1="-12" x2="-20" y2="5" stroke="${TEAL}" stroke-width="0.8" opacity="0.2" />
      <line x1="15" y1="-12" x2="20" y2="5" stroke="${TEAL}" stroke-width="0.8" opacity="0.2" />
      <line x1="-20" y1="5" x2="-10" y2="18" stroke="${TEAL}" stroke-width="0.8" opacity="0.2" />
      <line x1="20" y1="5" x2="10" y2="18" stroke="${TEAL}" stroke-width="0.8" opacity="0.2" />
      <!-- Label -->
      <text x="55" y="5" fill="${TEAL}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" opacity="0.5">AI</text>
    </g>
  `;

  // Floating particles
  const particles = [];
  for (let i = 0; i < 30; i++) {
    const px = Math.random() * WIDTH;
    const py = Math.random() * HEIGHT;
    const pr = 1 + Math.random() * 2;
    const popacity = 0.1 + Math.random() * 0.3;
    const pcolor = Math.random() > 0.5 ? TEAL : EMERALD;
    particles.push(`<circle cx="${px}" cy="${py}" r="${pr}" fill="${pcolor}" opacity="${popacity}" />`);
  }

  // Main title text
  const title = `
    <g filter="url(#textGlow)">
      <text x="${WIDTH / 2}" y="100" 
            text-anchor="middle" 
            fill="${WHITE}" 
            font-family="Arial, Helvetica, sans-serif" 
            font-size="64" 
            font-weight="900"
            letter-spacing="8">
        CONFIDEX AI
      </text>
    </g>
    <!-- Subtle underline accent -->
    <line x1="${WIDTH/2 - 220}" y1="115" x2="${WIDTH/2 + 220}" y2="115" 
          stroke="url(#shieldBorder)" stroke-width="2" opacity="0.4" />
  `;

  // Subtitle text
  const subtitle = `
    <text x="${WIDTH / 2}" y="${HEIGHT - 100}" 
          text-anchor="middle" 
          fill="${TEAL}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="22" 
          font-weight="400"
          letter-spacing="3"
          opacity="0.85">
      Privacy-Preserving AI Deal Room on SKALE
    </text>
  `;

  // SKALE Hackathon badge
  const badgeX = WIDTH - 200;
  const badgeY = HEIGHT - 70;
  const badge = `
    <g transform="translate(${badgeX}, ${badgeY})">
      <rect x="0" y="0" width="180" height="44" rx="22" 
            fill="${NAVY_DARK}" stroke="${TEAL}" stroke-width="1.5" opacity="0.9" />
      <text x="90" y="28" 
            text-anchor="middle" 
            fill="${TEAL}" 
            font-family="Arial, Helvetica, sans-serif" 
            font-size="13" 
            font-weight="700"
            letter-spacing="1">
        SKALE Hackathon 2026
      </text>
    </g>
  `;

  // Decorative corner accents
  const cornerAccents = `
    <!-- Top-left corner -->
    <path d="M 30 30 L 30 80" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <path d="M 30 30 L 80 30" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <!-- Top-right corner -->
    <path d="M ${WIDTH - 30} 30 L ${WIDTH - 30} 80" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <path d="M ${WIDTH - 30} 30 L ${WIDTH - 80} 30" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <!-- Bottom-left corner -->
    <path d="M 30 ${HEIGHT - 30} L 30 ${HEIGHT - 80}" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <path d="M 30 ${HEIGHT - 30} L 80 ${HEIGHT - 30}" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <!-- Bottom-right corner -->
    <path d="M ${WIDTH - 30} ${HEIGHT - 30} L ${WIDTH - 30} ${HEIGHT - 80}" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
    <path d="M ${WIDTH - 30} ${HEIGHT - 30} L ${WIDTH - 80} ${HEIGHT - 30}" stroke="${TEAL}" stroke-width="1.5" opacity="0.3" />
  `;

  // Assemble full SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  ${defs}
  ${background}
  ${bokeh}
  ${cornerAccents}
  ${dataStreams.join('\n  ')}
  ${binaryParticles.join('\n  ')}
  ${blockchain}
  ${shieldGlow}
  ${shield}
  ${innerShield}
  ${circuitry}
  ${lock}
  ${brain}
  ${particles.join('\n  ')}
  ${title}
  ${subtitle}
  ${badge}
</svg>`;

  return svg;
}

async function main() {
  console.log('Building SVG thumbnail...');
  const svgContent = buildSVG();
  
  // Save SVG for reference
  const svgPath = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svgContent);
  console.log(`SVG saved to ${svgPath}`);
  
  // Convert to PNG using Sharp
  console.log('Converting to PNG with Sharp...');
  
  const pngBuffer = await sharp(Buffer.from(svgContent), { density: 150 })
    .resize(1280, 720)
    .png()
    .toBuffer();
  
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`PNG thumbnail saved to ${outputPath}`);
  console.log(`File size: ${(pngBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
