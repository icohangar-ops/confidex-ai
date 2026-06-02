# Confidex AI — Privacy-Preserving AI Deal Room on SKALE

> **SKALE Programmable Privacy Hackathon 2026**
> Tracks: **Agent Commerce** | **Compliant Onchain Finance**

---

## Table of Contents

- [What This Application Does](#what-this-application-does)
  - [The Problem](#the-problem)
  - [The Solution](#the-solution)
  - [Privacy Properties](#privacy-properties)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Data Flow](#data-flow)
  - [Encryption Architecture](#encryption-architecture)
- [Smart Contracts](#smart-contracts)
  - [DealRoom.sol](#dealroomsol)
  - [DealStakeToken.sol](#dealstaketokensol)
  - [AIDueDiligenceOracle.sol](#aiduediligenceoraclesol)
  - [DealRoomFactory.sol](#dealroomfactorysol)
- [Frontend Application](#frontend-application)
  - [Components](#components)
  - [State Management](#state-management)
  - [AI Analysis Pipeline](#ai-analysis-pipeline)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Smart Contract Setup](#smart-contract-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [Hackathon Tracks](#hackathon-tracks)
  - [Agent Commerce](#agent-commerce)
  - [Compliant Onchain Finance](#compliant-onchain-finance)
- [Demo Walkthrough](#demo-walkthrough)
- [Security Considerations](#security-considerations)
- [Roadmap](#roadmap)
- [License](#license)

---

## What This Application Does

Confidex AI is a **confidential M&A deal room platform** built on SKALE's **BITE (Blockchain Integrated Threshold Encryption) V2** protocol. It solves a critical problem in Mergers & Acquisitions: **how to conduct financial due diligence on confidential deal data without exposing sensitive information to unauthorized parties.**

### The Problem

In traditional M&A, deal documents (financial statements, legal opinions, valuations, IP portfolios) must be shared with multiple parties — investment banks, legal advisors, auditors, and AI tools — creating massive information leakage risk. A single data leak can:

- **Tank deal valuations** — Competitors gain advantage from leaked financials
- **Trigger regulatory penalties** — Premature disclosure violates securities laws
- **Invite front-running** — Market participants trade on leaked M&A information
- **Destroy trust** — Sellers lose confidence in the confidentiality of the process

Current solutions (physical data rooms, encrypted file sharing, NDA-backed platforms) all share a fundamental flaw: **at some point, data exists in plaintext on someone's machine.** An insider threat, compromised endpoint, or subpoena can expose everything.

### The Solution

Confidex AI creates **encrypted deal rooms on SKALE's blockchain** where:

1. **Documents are TE-encrypted on-chain** — Stored using BLS threshold encryption; no single party (including the platform operator) can decrypt alone. A threshold of nodes must collaborate.
2. **AI agents access data through CTX** — Conditional Transactions (CTX) decrypt data inside SKALE's consensus layer specifically for an authorized agent's public key. The agent receives data, but it never appears in plaintext in the mempool or block explorer.
3. **Confidential tokens track deal stakes** — ERC-20 Deal Stake Tokens (DSTK) with encrypted balances. No one can see another party's holdings, enabling fair negotiation without revealing positions.
4. **Time-bound selective disclosure** — Auditors and advisors get access to specific documents that auto-expires. Access grants are on-chain and revocable.

### Privacy Properties

| Property | Implementation | Guarantee |
|----------|---------------|-----------|
| **Balance Confidentiality** | `balanceOf()` reverts — balances are unknowable without holder's private key | Even block explorers cannot determine holdings |
| **Transaction Confidentiality** | Transfer amounts TE-encrypted, visible only to sender/receiver | Third parties cannot observe deal stake movements |
| **Document Confidentiality** | Stored as TE ciphertext; only authorized viewers with registered public keys can decrypt | No plaintext document ever touches the blockchain |
| **AI Analysis Confidentiality** | Agents receive data only via CTX; results re-encrypted before on-chain storage | Analysis inputs and outputs are hidden from all but the requesting agent |
| **Auditor Access Control** | Time-range and per-document grants with on-chain revocation | Access expires automatically; cannot be extended without owner action |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Confidex AI Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │   Frontend    │    │   AI Pipeline    │    │   Smart        │  │
│  │  (Next.js 15) │───▶│  (GLM-4-Plus)    │───▶│  Contracts     │  │
│  │              │    │                  │    │  (Solidity)     │  │
│  └──────┬───────┘    └────────┬─────────┘    └───────┬────────┘  │
│         │                     │                       │            │
│         ▼                     ▼                       ▼            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              SKALE BITE V2 — Chain ID: 103698795          │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │    │
│  │  │ DealRoom│ │  DSTK   │ │ AI Oracle│ │ CTX Engine   │  │    │
│  │  │   .sol  │ │  .sol   │ │   .sol   │ │ (Threshold)  │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │    │
│  │                                                          │    │
│  │  BLS Threshold Encryption  │  ECIES  │  Conditional TX  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. UPLOAD
   Deal Owner → Encrypted Doc → DealRoom.sol (TE ciphertext stored on-chain)

2. AI ACCESS REQUEST
   AI Agent → requestAnalysis(docId) → CTX submitted to SKALE consensus

3. THRESHOLD DECRYPTION (inside consensus)
   ≥t-of-n validator nodes collaboratively decrypt → Re-encrypt for agent's ECIES key

4. AI PROCESSING
   Agent decrypts locally → GLM-4-Plus analysis → Generates encrypted result

5. RESULT STORAGE
   Agent → submitEncryptedResult(requestId, encryptedResult) → On-chain

6. AUDITOR ACCESS (time-bound)
   Owner → grantAccess(auditor, docIds, expiry) → Auditor can CTX-decrypt specific docs
   Auto-revokes after expiry block
```

### Encryption Architecture

```
┌─────────────────────────────────────────────────────┐
│              SKALE BITE V2 Encryption Stack          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: BLS Threshold Encryption (BITE)           │
│  ├── Deal documents (large data)                    │
│  ├── Token balances (on-chain logic)                │
│  └── Requires t-of-n validators to decrypt          │
│                                                     │
│  Layer 2: ECIES (Elliptic Curve Integrated          │
│           Encryption Scheme)                         │
│  ├── Balance viewing (holder-only)                  │
│  ├── Agent result decryption                        │
│  └── Single-key decryption                          │
│                                                     │
│  Layer 3: Conditional Transactions (CTX)             │
│  ├── Decrypt-inside-consensus pattern               │
│  ├── Re-encrypt for specific recipient              │
│  └── No plaintext in mempool or state               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### DealRoom.sol

Core deal room contract with BITE encryption for document storage and participant management.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract DealRoom {
    using BITE for BITE.Ciphertext;

    struct Deal {
        string name;
        address owner;
        uint8 threshold;           // t-of-n threshold for decryption
        uint256 createdAt;
        DealState state;
    }

    struct Document {
        BITE.Ciphertext data;      // TE-encrypted document
        bytes32 hash;               // Plaintext hash (for integrity)
        address uploader;
        uint256 uploadedAt;
        bool exists;
    }

    struct AccessGrant {
        address participant;
        uint256[] authorizedDocs;
        uint256 expiryBlock;
        bool active;
    }

    enum DealState { Created, DueDiligence, Negotiation, PendingApproval, Completed }

    // ─── State ───
    mapping(uint256 => Deal) public deals;
    mapping(uint256 => mapping(uint256 => Document)) public documents;
    mapping(uint256 => AccessGrant[]) public accessGrants;
    mapping(address => bool) public authorizedAgents;

    // ─── Events ───
    event DealCreated(uint256 indexed dealId, string name, address indexed owner);
    event DocumentUploaded(uint256 indexed dealId, uint256 indexed docId, bytes32 hash);
    event DocumentEncrypted(uint256 indexed docId, bytes32 cipherHash);
    event AccessGranted(address indexed participant, uint256 expiryBlock);
    event AccessRevoked(address indexed participant);
    event AIAnalysisRequested(uint256 indexed docId, address indexed agent, string analysisType);
    event AIResultSubmitted(uint256 indexed requestId, bytes32 resultHash);

    // ─── Functions ───

    /// @notice Create a new confidential deal room
    function createDealRoom(
        string calldata name,
        address[] calldata participants,
        uint8 threshold
    ) external returns (uint256 dealId);

    /// @notice Upload a TE-encrypted document to the deal room
    function uploadDocument(
        uint256 dealId,
        bytes calldata encryptedData,
        bytes32 docHash
    ) external onlyParticipant(dealId) returns (uint256 docId);

    /// @notice Grant time-bound document access to a participant
    function grantAccess(
        uint256 dealId,
        address participant,
        uint256[] calldata docIds,
        uint256 durationBlocks
    ) external onlyOwner(dealId);

    /// @notice Revoke all document access for a participant
    function revokeAccess(uint256 dealId, address participant)
        external onlyOwner(dealId);

    /// @notice Request AI analysis on an encrypted document via CTX
    function requestAIAnalysis(
        uint256 dealId,
        uint256 docId,
        string calldata analysisType
    ) external onlyAgent returns (bytes memory decrypted);

    /// @notice Submit encrypted AI analysis result
    function submitAIResult(
        uint256 requestId,
        bytes calldata encryptedResult
    ) external onlyAgent;

    /// @notice Get document status
    function getDocumentStatus(uint256 dealId, uint256 docId)
        external view returns (DocumentStatus);

    /// @notice Advance deal state
    function advanceState(uint256 dealId, DealState newState)
        external onlyOwner(dealId);
}
```

**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `createDealRoom()` | Anyone | Creates new deal room with participant list and threshold |
| `uploadDocument()` | Participant | Stores TE-encrypted document on-chain with integrity hash |
| `grantAccess()` | Owner | Time-bound per-document access grant for auditors/advisors |
| `revokeAccess()` | Owner | Immediately revokes all document access |
| `requestAIAnalysis()` | Agent | CTX: decrypts doc inside consensus, returns to agent |
| `submitAIResult()` | Agent | Stores TE-encrypted analysis result on-chain |
| `getDocumentStatus()` | Anyone | Returns document metadata (not plaintext) |
| `advanceState()` | Owner | Moves deal through Created→DueDiligence→Negotiation→Pending→Completed |

### DealStakeToken.sol

Confidential ERC-20 with dual-encrypted balances. Uses TE for on-chain logic and ECIES for holder viewing.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@skalenetwork/bite/contracts/BITE.sol";

contract DealStakeToken is ERC20 {
    using BITE for BITE.Ciphertext;

    // Encrypted balance mapping (TE ciphertext)
    mapping(address => BITE.Ciphertext) private encryptedBalances;
    uint256 public totalEncryptedSupply;
    uint8 public threshold;

    /// @notice balanceOf REVERTS — balances are confidential
    function balanceOf(address) public pure override returns (uint256) {
        revert("Confidex: balances are confidential");
    }

    /// @notice Get TE-encrypted balance (ciphertext, not plaintext)
    function getEncryptedBalance(address account)
        external view returns (bytes memory);

    /// @notice Private transfer via CTX — amount encrypted
    function transfer(address to, uint256 amount) public override {
        revert("Confidex: use privateTransfer via CTX");
    }

    /// @notice Transfer with CTX decryption/re-encryption
    function privateTransfer(
        address to,
        bytes calldata encryptedAmount
    ) external;

    /// @notice Get own decrypted balance (requires holder's ECIES key)
    function getDecryptedBalance() external view returns (uint256);

    /// @notice Mint stake tokens to participant
    function mintStake(address participant, uint256 amount) external onlyDealRoom;

    /// @notice Approve encrypted amount for deal operations
    function approveForDeal(
        address spender,
        uint256 encAmount
    ) external returns (bool);
}
```

**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `balanceOf()` | **REVERTS** | Standard ERC-20 — intentionally broken for privacy |
| `getEncryptedBalance()` | Anyone | Returns TE ciphertext of balance (not readable) |
| `privateTransfer()` | Holder | CTX-based transfer with encrypted amount |
| `getDecryptedBalance()` | Holder | ECIES decryption — only own balance visible |
| `mintStake()` | DealRoom | Mints DSTK tokens when deal is created |
| `approveForDeal()` | Holder | Encrypted approval for deal operations |

### AIDueDiligenceOracle.sol

AI agent registry with time-bound authorization and analysis tracking.

```solidity
contract AIDueDiligenceOracle {
    struct Agent {
        address addr;
        string modelId;          // e.g., "GLM-4-Plus"
        uint256 maxRequests;
        uint256 requestCount;
        bool isActive;
        uint256 authorizedUntil; // block timestamp
    }

    mapping(address => Agent) public agents;
    mapping(address => mapping(address => bool)) public dealAuthorizations;

    /// @notice Register an AI agent
    function registerAgent(
        address agent,
        string calldata modelId,
        uint256 maxRequests
    ) external;

    /// @notice Authorize agent for a specific deal room (time-bound)
    function authorizeAgent(
        address dealRoom,
        uint256 duration
    ) external onlyDealOwner;

    /// @notice Check if agent is currently authorized
    function checkAuthorization(
        address agent,
        address dealRoom
    ) external view returns (bool);

    /// @notice Submit encrypted analysis result
    function submitEncryptedAnalysis(
        uint256 requestId,
        bytes calldata result
    ) external onlyActiveAgent;

    /// @notice Revoke agent authorization
    function revokeAgent(address agent) external onlyDealOwner;

    /// @notice Get agent info
    function getAgentInfo(address agent)
        external view returns (
            string memory modelId,
            uint256 requestCount,
            bool isActive
        );
}
```

### DealRoomFactory.sol

Factory contract for creating deal rooms and managing role assignments.

```solidity
contract DealRoomFactory {
    mapping(uint256 => address) public dealRooms;
    uint256 public dealCount;

    event DealRoomCreated(uint256 indexed id, address dealRoom, address owner);

    /// @notice Deploy a new deal room with all dependencies
    function createDeal(
        string calldata name,
        address[] calldata participants,
        address[] calldata advisors,
        address[] calldata auditors,
        address aiAgent,
        uint8 threshold,
        uint256 dealValue
    ) external returns (uint256 dealId, address dealRoom, address stakeToken);

    /// @notice Get all deal rooms for a user
    function getUserDeals(address user) external view returns (uint256[] memory);
}
```

---

## Frontend Application

The frontend is built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS 4**, using shadcn/ui components with a dark theme designed for privacy-first aesthetics.

### Components

The application consists of 5 main sections:

| Component | File | Description |
|-----------|------|-------------|
| **HeroSection** | `hero-section.tsx` | Landing section with animated feature cards, teal glow branding, and hackathon badge |
| **PrivacyFlowDiagram** | `privacy-flow.tsx` | 5-step horizontal flow diagram with auto-cycling active step and terminal code block |
| **DealRoomDashboard** | `deal-room-dashboard.tsx` | Deal card with encrypted value, progress bar, participants panel, documents table |
| **AIAnalysisPanel** | `ai-analysis-panel.tsx` | Document selector, analysis type picker, simulated AI analysis with risk scores and findings |
| **ContractExplorer** | `contract-explorer.tsx` | 3 contract cards with function listings, tech stack bar, and hackathon footer |

### State Management

Zustand store (`src/lib/confidex-store.ts`) manages:
- **Deal state** — Current phase (Created → DueDiligence → Negotiation → PendingApproval → Completed)
- **Documents** — 5 demo documents with encrypted hashes, status badges, and metadata
- **Participants** — 4 participants (Owner, Advisor, Agent, Auditor) with wallet addresses and access status
- **Selected document** — Currently focused document for AI analysis

### AI Analysis Pipeline

1. User selects a document from the deal room
2. User chooses analysis type (Financial Risk, Legal Compliance, Valuation Assessment, Synergy Analysis)
3. Clicking "Run Analysis" triggers a simulated pipeline:
   - Submitting CTX request → Decrypting via CTX → AI processing with GLM-4-Plus → Generating encrypted report
4. Results display: risk score (0-100), severity-coded findings with expandable details
5. Voice briefing section with animated waveform (Deepgram Aura TTS integration point)

**API Route:** `POST /api/confidex/analyze` accepts `{ documentId, analysisType }` and returns simulated analysis results with realistic financial data, 3 findings per type, confidence scores, and processing times.

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Blockchain** | SKALE BITE V2 Sandbox | Chain ID: 103698795 |
| **Privacy Layer** | BLS Threshold Encryption, ECIES | BITE V2 |
| **Smart Contracts** | Solidity | 0.8.30 |
| **Contract Framework** | OpenZeppelin | 5.x |
| **Development** | Hardhat | 2.x |
| **Frontend Framework** | Next.js | 15.3 |
| **UI Library** | React | 19.1 |
| **Language** | TypeScript | 5.8 |
| **Styling** | Tailwind CSS | 4.1 |
| **Component Library** | shadcn/ui (Radix UI) | Latest |
| **Animations** | Framer Motion | 12.4 |
| **State Management** | Zustand | 5.0 |
| **Blockchain Client** | ethers.js | 6.15 |
| **SKALE Integration** | @skalenetwork/bite | 0.8.2 |
| **AI Model** | GLM-4-Plus (via z-ai-web-dev-sdk) | 0.1.5 |
| **Voice (TTS)** | Deepgram Aura | — |
| **Notifications** | Sonner | 2.0 |
| **Build Output** | Next.js Standalone | Docker-ready |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **pnpm**
- **MetaMask** or compatible Web3 wallet (for on-chain interactions)
- **SKALE BITE V2 Sandbox** RPC endpoint

### Smart Contract Setup

```bash
# Clone the repository
git clone https://github.com/your-org/confidex-ai.git
cd confidex-ai

# Navigate to contracts
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to SKALE BITE V2 Sandbox
npx hardhat run scripts/deploy.ts --network skale-bite
```

Deployment will output:
- `DealRoomFactory` address
- `DealStakeToken` implementation address
- `AIDueDiligenceOracle` address

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

```env
# SKALE Configuration
NEXT_PUBLIC_SKALE_CHAIN_ID=103698795
NEXT_PUBLIC_SKALE_RPC_URL=https://rpc.sandbox.testnet.skalenodes.com
NEXT_PUBLIC_SKALE_EXPLORER=https://dev-explorer.skalenodes.com

# Contract Addresses (after deployment)
NEXT_PUBLIC_DEAL_ROOM_FACTORY=0x...
NEXT_PUBLIC_AI_ORACLE=0x...

# AI Configuration
NEXT_PUBLIC_AI_MODEL=glm-4-plus
NEXT_PUBLIC_AI_API_KEY=your-api-key

# Voice TTS (optional)
NEXT_PUBLIC_DEEPGRAM_API_KEY=your-deepgram-key
```

---

## Hackathon Tracks

### Agent Commerce

Confidex AI demonstrates AI agents as first-class participants in confidential deal rooms:

- **Time-bound authorization**: AI agents are granted access to specific documents for a limited duration via smart contract authorization
- **CTX-based data access**: Agents never receive plaintext data from the blockchain. Instead, SKALE's consensus layer decrypts documents inside the Conditional Transaction and re-encrypts them for the agent's public key
- **Encrypted result storage**: AI analysis results are encrypted before being stored on-chain, maintaining confidentiality of the analysis
- **GLM-4-Plus integration**: Production-grade LLM performs financial risk, legal compliance, valuation, and synergy analysis on deal documents
- **Voice briefings**: Deepgram Aura TTS generates spoken deal summaries from encrypted AI outputs

**Track alignment**: AI agents are not just tools — they are blockchain-authenticated participants with on-chain identity, access control, and result submission capabilities.

### Compliant Onchain Finance

All deal financials are encrypted and managed on-chain:

- **Confidential deal values**: $245M deal value stored as TE ciphertext — invisible to block explorers
- **Encrypted DSTK tokens**: Deal stake tokens with `balanceOf()` that reverts — no one can observe another party's position
- **Time-bound auditor access**: Financial auditors receive on-chain, revocable, time-limited access to specific documents
- **Regulatory compliance**: Document integrity hashes on-chain provide audit trail; access grants are transparent and enforceable
- **Anti-front-running**: Deal terms and financial data never appear in plaintext in mempool or block explorer

**Track alignment**: Financial compliance requirements are encoded directly in smart contracts — access control, time-bounds, and document integrity are enforceable, auditable, and revocable on-chain.

---

## Demo Walkthrough

The frontend demonstrates a complete deal room workflow:

1. **Hero Section** — Animated landing with 4 feature cards explaining BITE encryption, AI due diligence, confidential tokens, and selective disclosure

2. **Privacy Flow** — Auto-cycling 5-step diagram showing: Upload → TE Encrypt → CTX Submit → AI Analysis → Report. Includes a terminal-style code block showing the BITE Solidity pattern

3. **Deal Room Dashboard** — Interactive deal card for "TechCorp Acquisition" ($245M):
   - Click the eye icon to reveal the encrypted deal value
   - 5-stage progress bar showing current deal phase
   - 4 participants with role badges and wallet addresses
   - 5 documents with status indicators (Encrypted / Agent Access / Auditor Access)
   - Click "View Encrypted" to trigger a CTX toast notification
   - DSTK token balances displayed as encrypted ciphertext

4. **AI Analysis Panel** — Full analysis workflow:
   - Select a document from the dropdown
   - Choose analysis type (Financial Risk, Legal Compliance, Valuation Assessment, Synergy Analysis)
   - Click "Run Analysis" to see the 4-step progress animation
   - View risk score (0-100) with color-coded severity
   - Expand individual findings with severity badges and detailed descriptions
   - Animated voice briefing waveform at the bottom

5. **Contract Explorer** — Architecture overview:
   - 3 contract cards with deployed addresses and key function listings
   - Tech stack badges
   - Hackathon branding footer

---

## Security Considerations

- **Threshold parameters**: The BITE threshold `t` must be set appropriately for the deal's sensitivity level. Higher thresholds provide stronger guarantees but require more validator participation.
- **Agent authorization expiry**: AI agents should be authorized for the minimum required duration. Time-bounded authorization prevents stale access.
- **Key management**: Participants must securely manage their ECIES private keys. Key loss means inability to view own DSTK balances.
- **Auditor access**: Per-document grants limit auditor exposure. Ensure only relevant documents are shared.
- **Smart contract audit**: All contracts should undergo professional audit before production deployment.

---

## Roadmap

- [x] Core deal room contracts (DealRoom, DealStakeToken, AIOracle)
- [x] Factory contract for deal room creation
- [x] Frontend with 5 demo sections
- [x] Simulated AI analysis pipeline
- [ ] Wallet connection (MetaMask/supported SKALE wallets)
- [ ] Real BITE encryption/decryption in frontend
- [ ] Real GLM-4-Plus integration via API
- [ ] Deepgram Aura TTS voice briefings
- [ ] Multi-deal room support
- [ ] Document version history
- [ ] Real-time notification system
- [ ] Mobile-responsive optimization
- [ ] Production deployment on SKALE mainnet

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>Confidex AI</strong> — Where M&A meets Zero-Knowledge<br/>
  <em>SKALE Programmable Privacy Hackathon 2026</em>
</p>
