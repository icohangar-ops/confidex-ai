import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';

mkdirSync('slides', { recursive: true });

const W = 1280, H = 720;
const BG_TOP = '#060a12';
const BG_BOT = '#0d1526';
const TEAL = '#14b8a6';
const TEAL_DIM = '#0d9488';
const EMERALD = '#10b981';
const WHITE = '#ffffff';
const GRAY = '#94a3b8';
const LIGHT_GRAY = '#cbd5e1';
const RED = '#ef4444';
const AMBER = '#f59e0b';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';
const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

function bg() {
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${BG_TOP}"/>
    <stop offset="100%" stop-color="${BG_BOT}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>`;
}

function grid() {
  let lines = '';
  for (let x = 0; x <= W; x += 80) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>`;
  }
  for (let y = 0; y <= H; y += 80) {
    lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>`;
  }
  return lines;
}

function glowDot(x, y, r, color) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.15"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="${color}" opacity="0.4"/>`;
}

function header(text, y = 60) {
  return `<text x="640" y="${y}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="36" font-weight="700" fill="${WHITE}">${text}</text>`;
}

function subheader(text, y, color = TEAL) {
  return `<text x="640" y="${y}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="400" fill="${color}">${text}</text>`;
}

function tealBar(y) {
  return `<rect x="570" y="${y}" width="140" height="3" rx="1.5" fill="${TEAL}"/>`;
}

function hexShield(cx, cy, size, color = TEAL) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  const poly = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p).join(' ') + ' Z';
  // Shield shape inside hexagon
  const s = size * 0.55;
  const shield = `M${cx},${cy - s} L${cx + s * 0.7},${cy - s * 0.5} L${cx + s * 0.7},${cy + s * 0.1} Q${cx + s * 0.7},${cy + s * 0.8} ${cx},${cy + s} Q${cx - s * 0.7},${cy + s * 0.8} ${cx - s * 0.7},${cy + s * 0.1} L${cx - s * 0.7},${cy - s * 0.5} Z`;
  return `<polygon points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>
    <path d="${shield}" fill="${color}" opacity="0.15" stroke="${color}" stroke-width="1.5"/>`;
}

async function renderSlide(svgStr, filename) {
  await sharp(Buffer.from(svgStr)).resize(W, H).png().toFile(`slides/${filename}`);
  console.log(`  ✓ slides/${filename}`);
}

// ─── SLIDE 1: Title ───
function slide1() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(200, 200, 60, TEAL)}${glowDot(1080, 500, 80, EMERALD)}${glowDot(640, 100, 40, BLUE)}
  ${hexShield(640, 310, 100)}
  <text x="640" y="300" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="700" fill="${TEAL}" letter-spacing="6">CONFIDEX</text>
  <text x="640" y="335" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="400" fill="${GRAY}" letter-spacing="2">AI</text>
  <text x="640" y="430" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="400" fill="${LIGHT_GRAY}">Privacy-Preserving AI Deal Room on SKALE</text>
  <rect x="490" y="460" width="300" height="3" rx="1.5" fill="${TEAL}"/>
  <rect x="505" y="490" width="270" height="36" rx="18" fill="rgba(20,184,166,0.1)" stroke="${TEAL}" stroke-width="1"/>
  <text x="640" y="513" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="600" fill="${TEAL}" letter-spacing="2">SKALE HACKATHON 2026</text>
  <!-- Corner decorations -->
  <line x1="40" y1="40" x2="40" y2="80" stroke="${TEAL}" stroke-width="2" opacity="0.4"/>
  <line x1="40" y1="40" x2="80" y2="40" stroke="${TEAL}" stroke-width="2" opacity="0.4"/>
  <line x1="1240" y1="680" x2="1240" y2="640" stroke="${TEAL}" stroke-width="2" opacity="0.4"/>
  <line x1="1240" y1="680" x2="1200" y2="680" stroke="${TEAL}" stroke-width="2" opacity="0.4"/>
</svg>`;
}

// ─── SLIDE 2: The Problem ───
function slide2() {
  const bullets = [
    "Sensitive financials shared with 10+ parties during due diligence",
    "Information leakage leads to front-running and deal failure",
    "No on-chain solution for confidential deal analysis"
  ];
  const bulletSvg = bullets.map((b, i) => {
    const y = 270 + i * 80;
    return `<rect x="180" y="${y}" width="920" height="60" rx="12" fill="${CARD_BG}" stroke="${CARD_BORDER}" stroke-width="1"/>
    <circle cx="210" cy="${y + 30}" r="12" fill="rgba(239,68,68,0.15)" stroke="${RED}" stroke-width="1.5"/>
    <text x="210" y="${y + 35}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="700" fill="${RED}">✕</text>
    <text x="240" y="${y + 36}" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="400" fill="${LIGHT_GRAY}">${b}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(160, 180, 50, RED)}${glowDot(1100, 600, 40, AMBER)}
  ${header('M&amp;A Data is Broken', 70)}
  ${tealBar(85)}
  <text x="640" y="130" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="400" fill="${GRAY}">Current due diligence processes expose sensitive deal information</text>
  <!-- Warning triangle -->
  <polygon points="640,170 620,205 660,205" fill="none" stroke="${AMBER}" stroke-width="2"/>
  <text x="640" y="201" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="700" fill="${AMBER}">!</text>
  ${bulletSvg}
  <text x="640" y="600" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="400" fill="${GRAY}">Deals fail. Valuations tank. Trust erodes.</text>
</svg>`;
}

// ─── SLIDE 3: The Solution ───
function slide3() {
  const features = [
    { icon: "🔒", title: "TE-Encrypted Documents", desc: "stored on-chain, never readable in plaintext", color: TEAL },
    { icon: "🤖", title: "AI Agent Access", desc: "BITE CTX decrypts only for authorized agents", color: EMERALD },
    { icon: "🪙", title: "Confidential Tokens", desc: "encrypted ERC-20 balances via threshold encryption", color: BLUE },
    { icon: "👁", title: "Selective Disclosure", desc: "time-bound access for auditors and advisors", color: PURPLE }
  ];
  const cards = features.map((f, i) => {
    const x = 80 + i * 290;
    return `<rect x="${x}" y="200" width="260" height="280" rx="16" fill="${CARD_BG}" stroke="${f.color}" stroke-width="1" opacity="0.9"/>
    <circle cx="${x + 130}" cy="270" r="40" fill="${f.color}" opacity="0.1" stroke="${f.color}" stroke-width="1"/>
    <text x="${x + 130}" y="280" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="28">${f.icon}</text>
    <text x="${x + 130}" y="340" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="700" fill="${WHITE}">${f.title}</text>
    <rect x="${x + 30}" y="355" width="200" height="1" fill="${f.color}" opacity="0.3"/>
    <text x="${x + 130}" y="385" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="400" fill="${GRAY}">${f.desc}</text>
    <rect x="${x + 20}" y="415" width="220" height="40" rx="8" fill="rgba(255,255,255,0.03)"/>
    <text x="${x + 130}" y="440" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="400" fill="${f.color}" opacity="0.7">SKALE BITE Protocol</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(640, 360, 120, TEAL)}${glowDot(100, 600, 40, EMERALD)}${glowDot(1180, 200, 50, BLUE)}
  ${header('Encrypted Deal Rooms on SKALE', 70)}
  ${tealBar(85)}
  <text x="640" y="130" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="400" fill="${GRAY}">Four pillars of privacy-preserving deal analysis</text>
  ${cards}
  <!-- Bottom accent -->
  <rect x="320" y="560" width="640" height="1" fill="${TEAL}" opacity="0.2"/>
  <text x="640" y="590" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="400" fill="${GRAY}">BLS Threshold Encryption + BITE Conditional Transactions</text>
</svg>`;
}

// ─── SLIDE 4: BITE Protocol ───
function slide4() {
  const steps = [
    { num: "1", label: "Upload", sub: "TE Encrypt", color: TEAL },
    { num: "2", label: "CTX", sub: "Submit", color: EMERALD },
    { num: "3", label: "Consensus", sub: "2t+1 of 3t+1", color: BLUE },
    { num: "4", label: "ECIES", sub: "Re-encrypt", color: PURPLE },
    { num: "5", label: "Agent", sub: "Analyzes", color: AMBER }
  ];
  const stepSvg = steps.map((s, i) => {
    const x = 130 + i * 210;
    const arrow = i < 4 ? `<line x1="${x + 50}" y1="260" x2="${x + 150}" y2="260" stroke="${TEAL}" stroke-width="1.5" opacity="0.4" stroke-dasharray="6,4"/>
    <polygon points="${x + 148},255 ${x + 158},260 ${x + 148},265" fill="${TEAL}" opacity="0.4"/>` : '';
    return `<circle cx="${x}" cy="260" r="35" fill="rgba(255,255,255,0.03)" stroke="${s.color}" stroke-width="1.5"/>
    <text x="${x}" y="255" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="700" fill="${s.color}">${s.num}</text>
    <text x="${x}" y="275" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="400" fill="${GRAY}">${s.label}</text>
    <text x="${x}" y="310" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" fill="${WHITE}">${s.sub}</text>${arrow}`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(320, 260, 80, TEAL)}${glowDot(960, 260, 60, PURPLE)}
  ${header('How SKALE BITE Works', 70)}
  ${tealBar(85)}
  <text x="640" y="130" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="400" fill="${GRAY}">Threshold Encrypted Conditional Transaction Execution</text>
  ${stepSvg}
  <!-- Code snippet box -->
  <rect x="240" y="380" width="800" height="90" rx="12" fill="rgba(0,0,0,0.5)" stroke="rgba(20,184,166,0.3)" stroke-width="1"/>
  <circle cx="265" cy="400" r="5" fill="#ef4444" opacity="0.6"/>
  <circle cx="285" cy="400" r="5" fill="#f59e0b" opacity="0.6"/>
  <circle cx="305" cy="400" r="5" fill="#22c55e" opacity="0.6"/>
  <text x="260" y="435" font-family="monospace" font-size="14" fill="${TEAL}">BITE</text><text x="296" y="435" font-family="monospace" font-size="14" fill="${GRAY}">.</text><text x="304" y="435" font-family="monospace" font-size="14" fill="${BLUE}">submitCTX</text><text x="396" y="435" font-family="monospace" font-size="14" fill="${GRAY}">(</text><text x="404" y="435" font-family="monospace" font-size="14" fill="${AMBER}">0x1B</text><text x="446" y="435" font-family="monospace" font-size="14" fill="${GRAY}">, gasLimit, encryptedArgs)</text>
  <text x="260" y="460" font-family="monospace" font-size="13" fill="${GRAY}">// → Consensus committee decrypts → Re-encrypts for agent → Executes</text>
  <!-- Privacy guarantee -->
  <rect x="360" y="520" width="560" height="50" rx="10" fill="rgba(20,184,166,0.08)" stroke="${TEAL}" stroke-width="1"/>
  <text x="640" y="551" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" fill="${TEAL}">Data never exposed in plaintext — decrypted only for the agent's key</text>
</svg>`;
}

// ─── SLIDE 5: Smart Contracts ───
function slide5() {
  const contracts = [
    { name: "DealRoom.sol", desc: "encrypted document storage + CTX access", color: TEAL, icon: "📄" },
    { name: "DealStakeToken.sol", desc: "confidential ERC-20 with encrypted balances", color: EMERALD, icon: "🪙" },
    { name: "DealRoomFactory.sol", desc: "role management + deal tracking", color: BLUE, icon: "🏭" },
    { name: "AIDueDiligenceOracle.sol", desc: "AI agent registry + time-bound auth", color: PURPLE, icon: "🧠" }
  ];
  const cards = contracts.map((c, i) => {
    const x = 80 + (i % 2) * 570;
    const y = 180 + Math.floor(i / 2) * 210;
    return `<rect x="${x}" y="${y}" width="530" height="180" rx="14" fill="${CARD_BG}" stroke="${c.color}" stroke-width="1"/>
    <rect x="${x}" y="${y}" width="530" height="4" rx="2" fill="${c.color}" opacity="0.5"/>
    <text x="${x + 30}" y="${y + 50}" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${c.color}">${c.icon}</text>
    <text x="${x + 65}" y="${y + 50}" font-family="monospace" font-size="17" font-weight="700" fill="${WHITE}">${c.name}</text>
    <rect x="${x + 30}" y="${y + 65}" width="470" height="1" fill="${CARD_BORDER}"/>
    <text x="${x + 30}" y="${y + 100}" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="400" fill="${GRAY}">${c.desc}</text>
    <rect x="${x + 30}" y="${y + 120}" width="470" height="36" rx="6" fill="rgba(0,0,0,0.3)"/>
    <text x="${x + 45}" y="${y + 143}" font-family="monospace" font-size="12" fill="${LIGHT_GRAY}" opacity="0.6">// SPDX-License-Identifier: MIT</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(640, 360, 100, BLUE)}${glowDot(120, 200, 40, PURPLE)}${glowDot(1160, 500, 50, TEAL)}
  ${header('Smart Contract Architecture', 70)}
  ${tealBar(85)}
  <text x="640" y="130" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="400" fill="${GRAY}">Solidity contracts deployed on SKALE chain</text>
  ${cards}
  <!-- Bottom connector line -->
  <line x1="345" y1="590" x2="935" y2="590" stroke="${TEAL}" stroke-width="1" opacity="0.3" stroke-dasharray="6,4"/>
  <circle cx="345" cy="590" r="4" fill="${TEAL}" opacity="0.4"/>
  <circle cx="640" cy="590" r="4" fill="${TEAL}" opacity="0.4"/>
  <circle cx="935" cy="590" r="4" fill="${TEAL}" opacity="0.4"/>
  <text x="640" y="615" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="400" fill="${GRAY}">Contracts interact via role-gated access patterns</text>
</svg>`;
}

// ─── SLIDE 6: AI Due Diligence ───
function slide6() {
  const steps = [
    { num: "1", text: "Document encrypted on SKALE chain" },
    { num: "2", text: "Owner grants AI agent time-bound access via CTX" },
    { num: "3", text: "BITE committee decrypts → re-encrypts for agent" },
    { num: "4", text: "GLM-4-Plus analyzes: Financial Risk, Legal Compliance, Valuation" },
    { num: "5", text: "Results encrypted and stored back on-chain" }
  ];
  const stepSvg = steps.map((s, i) => {
    const y = 190 + i * 65;
    return `<circle cx="160" cy="${y}" r="16" fill="rgba(20,184,166,0.1)" stroke="${TEAL}" stroke-width="1.5"/>
    <text x="160" y="${y + 5}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="700" fill="${TEAL}">${s.num}</text>
    <rect x="190" y="${y - 18}" width="820" height="36" rx="8" fill="${CARD_BG}" stroke="${CARD_BORDER}" stroke-width="1"/>
    <text x="210" y="${y + 6}" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="400" fill="${LIGHT_GRAY}">${s.text}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(120, 300, 60, PURPLE)}${glowDot(1160, 250, 50, TEAL)}
  ${header('AI-Powered Due Diligence', 70)}
  ${tealBar(85)}
  ${stepSvg}
  <!-- GLM Badge -->
  <rect x="940" y="145" width="240" height="34" rx="17" fill="rgba(139,92,246,0.1)" stroke="${PURPLE}" stroke-width="1"/>
  <text x="1060" y="167" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" fill="${PURPLE}">⚡ Powered by GLM-4-Plus</text>
  <!-- Right side flow arrow -->
  <line x1="1060" y1="195" x2="1060" y2="520" stroke="${TEAL}" stroke-width="1" opacity="0.2" stroke-dasharray="4,4"/>
  <polygon points="1055,518 1060,530 1065,518" fill="${TEAL}" opacity="0.3"/>
  <text x="1080" y="375" font-family="Inter,system-ui,sans-serif" font-size="11" fill="${GRAY}" transform="rotate(90,1080,375)">E2E ENCRYPTED PIPELINE</text>
</svg>`;
}

// ─── SLIDE 7: Demo Dashboard ───
function slide7() {
  // Deal room card
  const dealCard = `<rect x="60" y="150" width="560" height="100" rx="12" fill="rgba(20,184,166,0.06)" stroke="${TEAL}" stroke-width="1"/>
    <text x="90" y="180" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" fill="${WHITE}">🏢 TechCorp Acquisition</text>
    <text x="90" y="205" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${GRAY}">Due Diligence Phase</text>
    <rect x="430" y="170" width="80" height="24" rx="12" fill="rgba(16,185,129,0.15)" stroke="${EMERALD}" stroke-width="1"/>
    <text x="470" y="187" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="600" fill="${EMERALD}">Active</text>
    <text x="90" y="235" font-family="monospace" font-size="12" fill="${GRAY}">Deal ID: 0x4f2a...8e1c | Created: 2026-01-15</text>`;

  // Participants
  const participants = `<rect x="660" y="150" width="560" height="100" rx="12" fill="${CARD_BG}" stroke="${CARD_BORDER}" stroke-width="1"/>
    <text x="690" y="175" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" fill="${LIGHT_GRAY}">PARTICIPANTS</text>
    <circle cx="710" cy="210" r="14" fill="rgba(20,184,166,0.15)" stroke="${TEAL}" stroke-width="1"/>
    <text x="710" y="215" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="700" fill="${TEAL}">S</text>
    <text x="730" y="215" font-family="Inter,system-ui,sans-serif" font-size="11" fill="${GRAY}">Seller</text>
    <circle cx="810" cy="210" r="14" fill="rgba(59,130,246,0.15)" stroke="${BLUE}" stroke-width="1"/>
    <text x="810" y="215" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="700" fill="${BLUE}">B</text>
    <text x="830" y="215" font-family="Inter,system-ui,sans-serif" font-size="11" fill="${GRAY}">Buyer</text>
    <circle cx="910" cy="210" r="14" fill="rgba(139,92,246,0.15)" stroke="${PURPLE}" stroke-width="1"/>
    <text x="910" y="215" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="700" fill="${PURPLE}">A</text>
    <text x="930" y="215" font-family="Inter,system-ui,sans-serif" font-size="11" fill="${GRAY}">AI Agent</text>
    <circle cx="1020" cy="210" r="14" fill="rgba(245,158,11,0.15)" stroke="${AMBER}" stroke-width="1"/>
    <text x="1020" y="215" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="700" fill="${AMBER}">A</text>
    <text x="1040" y="215" font-family="Inter,system-ui,sans-serif" font-size="11" fill="${GRAY}">Auditor</text>
    <rect x="690" y="230" width="50" height="6" rx="3" fill="${TEAL}" opacity="0.4"/>`;

  // Documents table
  const docs = `<rect x="60" y="270" width="560" height="160" rx="12" fill="${CARD_BG}" stroke="${CARD_BORDER}" stroke-width="1"/>
    <text x="90" y="298" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" fill="${LIGHT_GRAY}">DOCUMENTS</text>
    <rect x="80" y="310" width="520" height="1" fill="${CARD_BORDER}"/>
    <text x="90" y="335" font-family="monospace" font-size="12" fill="${EMERALD}">🔒</text>
    <text x="110" y="335" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${LIGHT_GRAY}">financial_statements_Q4.pdf</text>
    <text x="440" y="335" font-family="monospace" font-size="11" fill="${TEAL}">TE-ENCRYPTED</text>
    <text x="90" y="360" font-family="monospace" font-size="12" fill="${EMERALD}">🔒</text>
    <text x="110" y="360" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${LIGHT_GRAY}">legal_review_contract.docx</text>
    <text x="440" y="360" font-family="monospace" font-size="11" fill="${AMBER}">CTX PENDING</text>
    <text x="90" y="385" font-family="monospace" font-size="12" fill="${EMERALD}">🔒</text>
    <text x="110" y="385" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${LIGHT_GRAY}">valuation_model_v3.xlsx</text>
    <text x="440" y="385" font-family="monospace" font-size="11" fill="${TEAL}">TE-ENCRYPTED</text>
    <text x="90" y="410" font-family="monospace" font-size="12" fill="${EMERALD}">🔒</text>
    <text x="110" y="410" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${LIGHT_GRAY}">synergy_analysis_report.pdf</text>
    <text x="440" y="410" font-family="monospace" font-size="11" fill="${BLUE}">AGENT ACCESS</text>`;

  // Token balances
  const tokens = `<rect x="660" y="270" width="560" height="160" rx="12" fill="${CARD_BG}" stroke="${CARD_BORDER}" stroke-width="1"/>
    <text x="690" y="298" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" fill="${LIGHT_GRAY}">TOKEN BALANCES (ENCRYPTED)</text>
    <rect x="680" y="310" width="520" height="1" fill="${CARD_BORDER}"/>
    <text x="690" y="340" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${GRAY}">DealStake (Seller)</text>
    <text x="1140" y="340" text-anchor="end" font-family="monospace" font-size="14" fill="${TEAL}">••••••••</text>
    <text x="690" y="370" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${GRAY}">DealStake (Buyer)</text>
    <text x="1140" y="370" text-anchor="end" font-family="monospace" font-size="14" fill="${TEAL}">••••••••</text>
    <text x="690" y="400" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${GRAY}">DealStake (AI Agent)</text>
    <text x="1140" y="400" text-anchor="end" font-family="monospace" font-size="14" fill="${TEAL}">••••••••</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(640, 360, 140, TEAL)}${glowDot(100, 150, 40, EMERALD)}
  ${header('Live Demo', 70)}
  ${tealBar(85)}
  <text x="640" y="130" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="400" fill="${GRAY}">Confidex AI Dashboard — Deal Room Overview</text>
  ${dealCard}
  ${participants}
  ${docs}
  ${tokens}
  <!-- Disclaimer -->
  <rect x="340" y="470" width="600" height="28" rx="14" fill="rgba(245,158,11,0.08)" stroke="${AMBER}" stroke-width="0.5"/>
  <text x="640" y="489" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" fill="${AMBER}" opacity="0.7">⚠ All data shown is simulated for hackathon demo purposes</text>
</svg>`;
}

// ─── SLIDE 8: Closing ───
function slide8() {
  const tracks = [
    { label: "Agent Commerce", icon: "🤖" },
    { label: "Compliant Onchain Finance", icon: "💰" }
  ];
  const trackSvg = tracks.map((t, i) => {
    const x = 440 + i * 220;
    return `<rect x="${x}" y="350" width="200" height="40" rx="20" fill="rgba(20,184,166,0.08)" stroke="${TEAL}" stroke-width="1"/>
    <text x="${x + 100}" y="375" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="500" fill="${TEAL}">${t.label}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg()}${grid()}
  ${glowDot(640, 350, 100, TEAL)}${glowDot(200, 400, 60, EMERALD)}${glowDot(1080, 400, 60, BLUE)}
  ${hexShield(640, 200, 50)}
  <text x="640" y="70" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="600" fill="${LIGHT_GRAY}">Built for SKALE Programmable Privacy Hackathon 2026</text>
  <rect x="370" y="80" width="540" height="2" rx="1" fill="${TEAL}" opacity="0.3"/>
  <text x="640" y="120" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="400" fill="${GRAY}">HACKATHON TRACKS</text>
  ${trackSvg}
  <!-- Open source badge -->
  <rect x="310" y="420" width="660" height="44" rx="10" fill="${CARD_BG}" stroke="${TEAL}" stroke-width="1"/>
  <text x="640" y="448" text-anchor="middle" font-family="monospace" font-size="15" font-weight="600" fill="${TEAL}">github.com/icohangar-ops/confidex-ai</text>
  <!-- Thank You -->
  <text x="640" y="550" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="56" font-weight="700" fill="${WHITE}" letter-spacing="4">Thank You</text>
  <rect x="540" y="565" width="200" height="3" rx="1.5" fill="${TEAL}"/>
  <!-- SKALE logo placeholder -->
  ${hexShield(640, 630, 25)}
  <text x="640" y="680" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="400" fill="${GRAY}">SKALE Network</text>
</svg>`;
}

// ─── MAIN ───
async function main() {
  console.log('Generating 8 slide PNGs at 1280x720...\n');

  await renderSlide(slide1(), 'slide_01.png');
  await renderSlide(slide2(), 'slide_02.png');
  await renderSlide(slide3(), 'slide_03.png');
  await renderSlide(slide4(), 'slide_04.png');
  await renderSlide(slide5(), 'slide_05.png');
  await renderSlide(slide6(), 'slide_06.png');
  await renderSlide(slide7(), 'slide_07.png');
  await renderSlide(slide8(), 'slide_08.png');

  console.log('\nAll slides generated successfully!');
}

main().catch(console.error);
