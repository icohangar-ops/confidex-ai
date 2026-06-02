import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('narration', { recursive: true });

const API_KEY = process.env.DEEPGRAM_API_KEY;
const USE_DEEPGRAM = !!API_KEY;

const narrations = [
  {
    id: 'narr_1',
    filename: 'narr_1.mp3',
    text: `Welcome to Confidex AI — a privacy-preserving AI deal room built on SKALE's Programmable Privacy protocol. Today, M&A due diligence is broken. Sensitive financial documents — revenue data, valuations, legal opinions — are shared with dozens of parties during a deal. A single data leak can tank valuations, trigger regulatory penalties, or invite front-running. There has never been an on-chain solution for conducting confidential deal analysis. Until now.`
  },
  {
    id: 'narr_2',
    filename: 'narr_2.mp3',
    text: `Confidex AI creates encrypted deal rooms on SKALE's blockchain. All deal documents are stored using BLS threshold encryption — meaning no single party can decrypt them. When an AI agent needs to analyze a document, we use SKALE's BITE protocol. A Conditional Transaction is submitted to the consensus committee. Two-thirds of the nodes jointly decrypt the data and re-encrypt it specifically for the agent's public key. The agent processes the data and returns an encrypted result. At no point is the data ever visible in plaintext on-chain.`
  },
  {
    id: 'narr_3',
    filename: 'narr_3.mp3',
    text: `Our smart contracts include Deal Room for encrypted document management, Deal Stake Token — a confidential ERC-20 with encrypted balances, a Factory for role management, and an AI Oracle for time-bound agent authorization. The AI due diligence engine supports financial risk analysis, legal compliance checks, valuation assessments, and synergy analysis. All powered by GLM-4-Plus. The entire workflow runs through BITE's Conditional Transactions — from document decryption to result encryption.`
  },
  {
    id: 'narr_4',
    filename: 'narr_4.mp3',
    text: `This is the deal room dashboard. You can see the active deal with its lifecycle stage, encrypted documents with their access status, and participants with their roles. Token balances are completely encrypted — visible only to the holder. Confidex AI demonstrates that private markets can operate on-chain with full confidentiality. Built for the SKALE Programmable Privacy Hackathon. Thank you.`
  }
];

// Generate a silent MP3 file of a given duration in seconds
// We'll create a minimal valid MP3 with silence using raw PCM headers
function generateSilentMP3(durationSec) {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;

  // WAV header
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // silence (zeros are already there)

  return buffer;
}

async function generateWithDeepgram(narr) {
  const url = 'https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3&sample_rate=22050';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: narr.text })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Deepgram API error ${response.status}: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log(USE_DEEPGRAM
    ? 'DEEPGRAM_API_KEY found — generating TTS narration...\n'
    : 'DEEPGRAM_API_KEY not found — creating silent placeholder audio...\n'
  );

  // Duration estimates for silent placeholders (in seconds)
  // Segment 1: ~30s, Segment 2: ~35s, Segment 3: ~35s, Segment 4: ~30s
  const durations = [30, 35, 35, 30];

  for (let i = 0; i < narrations.length; i++) {
    const narr = narrations[i];
    try {
      if (USE_DEEPGRAM) {
        console.log(`  Generating ${narr.filename} via Deepgram TTS...`);
        const audioBuffer = await generateWithDeepgram(narr);
        writeFileSync(`narration/${narr.filename}`, audioBuffer);
        console.log(`  ✓ narration/${narr.filename} (${audioBuffer.length} bytes)`);
      } else {
        // Generate silent WAV as placeholder
        console.log(`  Creating silent placeholder ${narr.filename} (${durations[i]}s)...`);
        const wavData = generateSilentMP3(durations[i]);
        writeFileSync(`narration/${narr.filename}`, wavData);
        console.log(`  ✓ narration/${narr.filename} (silent ${durations[i]}s placeholder)`);
      }
    } catch (err) {
      console.error(`  ✗ Failed for ${narr.filename}: ${err.message}`);
      console.log(`  → Creating silent fallback...`);
      const wavData = generateSilentMP3(durations[i]);
      writeFileSync(`narration/${narr.filename}`, wavData);
      console.log(`  ✓ narration/${narr.filename} (silent fallback)`);
    }
  }

  console.log('\nAll narration files generated!');
  console.log(USE_DEEPGRAM ? 'NOTE: Audio is real TTS from Deepgram.' : 'NOTE: Audio files are silent placeholders. Set DEEPGRAM_API_KEY env var and re-run for real TTS.');
}

main().catch(console.error);
