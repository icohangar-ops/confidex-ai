"use client";

import { motion } from "framer-motion";
import {
  Code2,
  FileCode2,
  BrainCircuit,
  Shield,
  Layers,
  Lock,
  Database,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const contracts = [
  {
    name: "DealRoom.sol",
    icon: FileCode2,
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    address: "0x1a2B...8f3E",
    description: "Core deal room with BITE encryption, participant management, and document lifecycle.",
    functions: [
      "createDealRoom(string name, address[] participants)",
      "uploadDocument(bytes encryptedData, bytes32 docHash)",
      "grantAccess(address participant, uint256[] docIds, uint256 expiry)",
      "revokeAccess(address participant)",
      "requestAIAnalysis(uint256 docId, string analysisType)",
      "submitAIResult(uint256 requestId, bytes encryptedResult)",
      "getDocumentStatus(uint256 docId) → DocumentStatus",
    ],
  },
  {
    name: "DealStakeToken.sol",
    icon: Layers,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    address: "0x4c5D...2a7B",
    description: "Confidential ERC-20 with dual-encrypted balances (TE for logic, ECIES for viewing).",
    functions: [
      "balanceOf(address) — REVERTS (private)",
      "getEncryptedBalance(address) → bytes (TE ciphertext)",
      "transfer(address to, uint256 amount) via CTX",
      "privateTransfer(address to, bytes encAmount)",
      "approveForDeal(address spender, uint256 encAmount)",
      "mintStake(address participant, uint256 amount)",
      "getDecryptedBalance() → uint256 (owner only, via ECIES)",
    ],
  },
  {
    name: "AIDueDiligenceOracle.sol",
    icon: BrainCircuit,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    address: "0x7e9F...c41D",
    description: "AI agent registry with time-bound authorization and encrypted analysis tracking.",
    functions: [
      "registerAgent(address agent, string modelId, uint256 maxRequests)",
      "authorizeAgent(address dealRoom, uint256 duration)",
      "checkAuthorization(address agent, address dealRoom) → bool",
      "submitEncryptedAnalysis(uint256 requestId, bytes result)",
      "getAnalysisCount(address agent) → uint256",
      "revokeAgent(address agent)",
      "getAgentInfo(address) → (string modelId, uint256 reqCount, bool active)",
    ],
  },
];

const techStack = [
  { label: "SKALE BITE V2", icon: Shield },
  { label: "Solidity 0.8.30", icon: Code2 },
  { label: "OpenZeppelin 5.x", icon: Lock },
  { label: "ethers.js v6", icon: Database },
  { label: "Next.js 15", icon: Zap },
  { label: "React 19", icon: Layers },
  { label: "GLM-4-Plus", icon: BrainCircuit },
  { label: "Deepgram Aura", icon: Zap },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ContractExplorer() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2">
            Smart Contract{" "}
            <span className="text-teal-400">Architecture</span>
          </h2>
          <p className="text-slate-400 mb-4">
            On-chain deal rooms with threshold encryption, confidential tokens,
            and AI oracle integration.
          </p>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 mb-10">
            SKALE BITE V2 — Chain ID: 103698795
          </Badge>
        </motion.div>

        {/* Contract Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {contracts.map((contract) => (
            <motion.div key={contract.name} variants={item}>
              <Card className="bg-slate-900/60 border-slate-800 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div
                        className={`w-8 h-8 rounded-lg ${contract.bgColor} flex items-center justify-center`}
                      >
                        <contract.icon
                          className={`w-4 h-4 ${contract.color}`}
                        />
                      </div>
                      {contract.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-xs text-slate-500 mb-1 font-mono">
                    Deployed: {contract.address}
                  </p>
                  <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                    {contract.description}
                  </p>

                  {/* Terminal-style function list */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 bg-slate-900/50">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                      <span className="text-[10px] text-slate-500 font-mono">
                        {contract.name}
                      </span>
                    </div>
                    <div className="p-3 space-y-1">
                      {contract.functions.map((fn, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono text-slate-400 leading-relaxed hover:text-slate-200 transition-colors"
                        >
                          <span className="text-emerald-400/70 mr-1">fn</span>{" "}
                          {fn}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tech Stack Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-4 text-center">
                Tech Stack
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {techStack.map((tech) => (
                  <Badge
                    key={tech.label}
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1.5 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 transition-colors"
                  >
                    <tech.icon className="w-3.5 h-3.5 text-teal-400" />
                    {tech.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-8 border-t border-slate-800/50"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span className="font-medium text-slate-300">
                Confidex AI
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span>SKALE Programmable Privacy Hackathon 2026</span>
              <span className="text-slate-700">|</span>
              <span>Agent Commerce • Compliant Onchain Finance</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
