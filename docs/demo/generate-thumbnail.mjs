import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const W = 1280, H = 720;

// Helper: draw rounded rect as SVG
function svgRect(x, y, w, h, fill, rx = 0, opacity = 1) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${opacity}"/>`;
}

// Helper: draw circle
function svgCircle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
}

// Helper: draw line
function svgLine(x1, y1, x2, y2, stroke, sw = 2, opacity = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}

// Build the SVG
const elements = [];

// Background gradient
elements.push(`
<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#0a0f1e"/>
    <stop offset="50%" stop-color="#0d1526"/>
    <stop offset="100%" stop-color="#060a12"/>
  </linearGradient>
  <linearGradient id="shield" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#10b981" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.05"/>
  </linearGradient>
  <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#10b981"/>
    <stop offset="100%" stop-color="#14b8a6"/>
  </linearGradient>
  <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#10b981" stop-opacity="0"/>
    <stop offset="50%" stop-color="#14b8a6" stop-opacity="0.8"/>
    <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
  </linearGradient>
  <filter id="glow">
    <feGaussianBlur stdDeviation="8" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softGlow">
    <feGaussianBlur stdDeviation="20" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
`);

// BG
elements.push(svgRect(0, 0, W, H, 'url(#bg)'));

// Subtle grid
for (let i = 0; i < W; i += 80) {
  elements.push(svgLine(i, 0, i, H, '#1e293b', 0.5, 0.1));
}
for (let i = 0; i < H; i += 80) {
  elements.push(svgLine(0, i, W, i, '#1e293b', 0.5, 0.1));
}

// Glow blobs
elements.push(svgCircle(300, 360, 250, '#10b981', 0.06));
elements.push(svgCircle(980, 300, 200, '#14b8a6', 0.05));
elements.push(svgCircle(640, 400, 180, '#059669', 0.04));

// Blockchain nodes on left side
const leftNodes = [[80, 200], [120, 350], [90, 500], [180, 280], [160, 430]];
leftNodes.forEach(([x, y]) => {
  elements.push(svgCircle(x, y, 6, '#10b981', 0.7));
  elements.push(svgCircle(x, y, 12, '#10b981', 0.15));
});

// Connect left nodes
for (let i = 0; i < leftNodes.length - 1; i++) {
  elements.push(svgLine(leftNodes[i][0], leftNodes[i][1], leftNodes[i+1][0], leftNodes[i+1][1], '#10b981', 1.5, 0.3));
}

// Blockchain nodes on right side
const rightNodes = [[1100, 200], [1140, 350], [1110, 500], [1200, 280], [1180, 430]];
rightNodes.forEach(([x, y]) => {
  elements.push(svgCircle(x, y, 6, '#14b8a6', 0.7));
  elements.push(svgCircle(x, y, 12, '#14b8a6', 0.15));
});
for (let i = 0; i < rightNodes.length - 1; i++) {
  elements.push(svgLine(rightNodes[i][0], rightNodes[i][1], rightNodes[i+1][0], rightNodes[i+1][1], '#14b8a6', 1.5, 0.3));
}

// Data streams (binary)
for (let y = 150; y < 600; y += 40) {
  elements.push(`<text x="250" y="${y}" font-family="monospace" font-size="10" fill="#10b981" opacity="0.15">01101001</text>`);
  elements.push(`<text x="${W - 350}" y="${y + 20}" font-family="monospace" font-size="10" fill="#14b8a6" opacity="0.15">10010110</text>`);
}

// Center hexagonal shield (approximated with polygon)
const cx = 640, cy = 370, s = 130;
const hex = [];
for (let i = 0; i < 6; i++) {
  const angle = (Math.PI / 3) * i - Math.PI / 6;
  hex.push(`${cx + s * Math.cos(angle)},${cy + s * Math.sin(angle)}`);
}
elements.push(`<polygon points="${hex.join(' ')}" fill="url(#shield)" stroke="url(#shieldBorder)" stroke-width="2.5" filter="url(#glow)"/>`);

// Inner shield
const s2 = 100;
const hex2 = [];
for (let i = 0; i < 6; i++) {
  const angle = (Math.PI / 3) * i - Math.PI / 6;
  hex2.push(`${cx + s2 * Math.cos(angle)},${cy + s2 * Math.sin(angle)}`);
}
elements.push(`<polygon points="${hex2.join(' ')}" fill="none" stroke="#10b981" stroke-width="1" opacity="0.3"/>`);

// Lock icon (simplified path)
elements.push(`
<g transform="translate(${cx - 25}, ${cy - 15})">
  <rect x="5" y="25" width="40" height="32" rx="4" fill="#10b981" opacity="0.9"/>
  <path d="M15 25 V18 A15 15 0 0 1 35 18 V25" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
  <circle cx="25" cy="40" r="5" fill="#060a12"/>
  <rect x="23" y="42" width="4" height="8" rx="1" fill="#060a12"/>
</g>
`);

// Title: CONFIDEX AI
elements.push(`
<text x="${W/2}" y="100" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="62" fill="white" letter-spacing="8">
  CONFIDEX AI
</text>
`);
// Teal glow text (behind, offset)
elements.push(`
<text x="${W/2}" y="100" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="62" fill="#10b981" opacity="0.3" letter-spacing="8" filter="url(#softGlow)">
  CONFIDEX AI
</text>
`);

// Subtitle
elements.push(`
<text x="${W/2}" y="145" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#5eead4" opacity="0.9" letter-spacing="2">
  Privacy-Preserving AI Deal Room on SKALE
</text>
`);

// Horizontal accent line
elements.push(svgRect(340, 160, 600, 2, 'url(#glowLine)'));

// Feature labels
const features = [
  { icon: '🛡️', text: 'BITE Encryption', x: 180, y: 570 },
  { icon: '🧠', text: 'AI Due Diligence', x: 440, y: 570 },
  { icon: '🔒', text: 'Confidential Tokens', x: 720, y: 570 },
  { icon: '👁️', text: 'Selective Disclosure', x: 1000, y: 570 },
];

features.forEach(({ icon, text, x, y }) => {
  elements.push(`
    <rect x="${x - 70}" y="${y - 20}" width="140" height="40" rx="20" fill="#10b981" opacity="0.1" stroke="#10b981" stroke-width="1" stroke-opacity="0.3"/>
    <text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#5eead4" font-weight="600">${text}</text>
  `);
});

// Bottom badge
elements.push(`
<rect x="${W - 290}" y="${H - 65}" width="260" height="40" rx="20" fill="#10b981" opacity="0.15" stroke="#10b981" stroke-width="1" stroke-opacity="0.4"/>
<text x="${W - 160}" y="${H - 39}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#10b981" font-weight="700">SKALE Hackathon 2026</text>
`);

// Corner brackets
const bs = 30, bo = 20;
// Top-left
elements.push(`<path d="M${bo},${bo + bs} L${bo},${bo} L${bo + bs},${bo}" fill="none" stroke="#10b981" stroke-width="2" opacity="0.4"/>`);
// Top-right
elements.push(`<path d="M${W - bo - bs},${bo} L${W - bo},${bo} L${W - bo},${bo + bs}" fill="none" stroke="#14b8a6" stroke-width="2" opacity="0.4"/>`);
// Bottom-left
elements.push(`<path d="M${bo},${H - bo - bs} L${bo},${H - bo} L${bo + bs},${H - bo}" fill="none" stroke="#14b8a6" stroke-width="2" opacity="0.4"/>`);
// Bottom-right
elements.push(`<path d="M${W - bo - bs},${H - bo} L${W - bo},${H - bo} L${W - bo},${H - bo - bs}" fill="none" stroke="#10b981" stroke-width="2" opacity="0.4"/>`);

const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${elements.join('\n')}</svg>`;

// Render to PNG
const outPath = path.join(import.meta.dirname, 'thumbnail.png');
await sharp(Buffer.from(svgStr))
  .resize(W, H)
  .png({ quality: 95 })
  .toFile(outPath);

console.log(`Thumbnail saved: ${outPath}`);
