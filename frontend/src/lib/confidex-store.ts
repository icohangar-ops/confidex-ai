import { create } from "zustand";

/* ─── Enums ──────────────────────────────────────────────── */

export enum DealState {
  Created = "Created",
  DueDiligence = "Due Diligence",
  Negotiation = "Negotiation",
  PendingApproval = "Pending Approval",
  Completed = "Completed",
}

export enum DocumentType {
  FinancialStatements = "Financial Statements",
  LegalOpinion = "Legal Opinion",
  ValuationReport = "Valuation Report",
  TermSheet = "Term Sheet",
  IPPortfolio = "IP Portfolio",
}

export enum DocumentStatus {
  Encrypted = "Encrypted",
  AgentAccess = "Agent Access",
  AuditorAccess = "Auditor Access",
}

/* ─── Interfaces ─────────────────────────────────────────── */

export interface Participant {
  id: string;
  name: string;
  role: string;
  color: string;
  walletAddress: string;
  hasAccess: boolean;
}

export interface DealDocument {
  id: string;
  type: DocumentType;
  name: string;
  status: DocumentStatus;
  encryptedHash: string;
  size: string;
  uploadedAt: string;
}

/* ─── Demo Data ─────────────────────────────────────────── */

const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    name: "MegaCorp",
    role: "Owner",
    color: "#10b981",
    walletAddress: "0x742d...3a1f",
    hasAccess: true,
  },
  {
    id: "p2",
    name: "Goldman Legal",
    role: "Advisor",
    color: "#3b82f6",
    walletAddress: "0x91ae...8c2d",
    hasAccess: true,
  },
  {
    id: "p3",
    name: "DeepVault AI",
    role: "Agent",
    color: "#f59e0b",
    walletAddress: "0x5f3c...e47b",
    hasAccess: true,
  },
  {
    id: "p4",
    name: "Ernst Audit",
    role: "Auditor",
    color: "#8b5cf6",
    walletAddress: "0xc8d1...09f5",
    hasAccess: false,
  },
];

const DEMO_DOCUMENTS: DealDocument[] = [
  {
    id: "doc1",
    type: DocumentType.FinancialStatements,
    name: "FY2024 Financial Statements",
    status: DocumentStatus.Encrypted,
    encryptedHash: "0xab3f...8e21",
    size: "4.2 MB",
    uploadedAt: "2026-06-02",
  },
  {
    id: "doc2",
    type: DocumentType.LegalOpinion,
    name: "Regulatory Compliance Opinion",
    status: DocumentStatus.AgentAccess,
    encryptedHash: "0x7d1c...f3a9",
    size: "2.8 MB",
    uploadedAt: "2026-06-03",
  },
  {
    id: "doc3",
    type: DocumentType.ValuationReport,
    name: "Independent Valuation Report",
    status: DocumentStatus.Encrypted,
    encryptedHash: "0xe54b...1c7d",
    size: "6.1 MB",
    uploadedAt: "2026-06-04",
  },
  {
    id: "doc4",
    type: DocumentType.TermSheet,
    name: "Acquisition Term Sheet v3.1",
    status: DocumentStatus.AuditorAccess,
    encryptedHash: "0x92fa...b5e3",
    size: "1.3 MB",
    uploadedAt: "2026-06-05",
  },
  {
    id: "doc5",
    type: DocumentType.IPPortfolio,
    name: "Patent & Trademark Portfolio",
    status: DocumentStatus.AgentAccess,
    encryptedHash: "0x4c8e...a72f",
    size: "8.7 MB",
    uploadedAt: "2026-06-06",
  },
];

/* ─── Store ──────────────────────────────────────────────── */

interface ConfidexState {
  dealState: DealState;
  documents: DealDocument[];
  participants: Participant[];
  selectedDocument: DealDocument | null;

  setDealState: (state: DealState) => void;
  setSelectedDocument: (doc: DealDocument | null) => void;
}

export const useConfidexStore = create<ConfidexState>((set) => ({
  dealState: DealState.DueDiligence,
  documents: DEMO_DOCUMENTS,
  participants: DEMO_PARTICIPANTS,
  selectedDocument: null,

  setDealState: (state) => set({ dealState: state }),
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),
}));
