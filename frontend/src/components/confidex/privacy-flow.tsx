"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Lock, Send, Brain, FileCheck } from "lucide-react";

const steps = [
  { icon: Upload, label: "Upload Document", desc: "Deal documents uploaded by room owner" },
  { icon: Lock, label: "TE Encrypt", desc: "BLS threshold encryption via BITE protocol" },
  { icon: Send, label: "CTX Submit", desc: "Conditional Transaction submitted to AI agent" },
  { icon: Brain, label: "AI Analysis", desc: "GLM-4-Plus processes decrypted data in consensus" },
  { icon: FileCheck, label: "Report", desc: "Encrypted report stored on-chain" },
];

const codeBlock = `// BITE Threshold Encryption Pattern
contract DealRoom {
  using BITE for BITE.Ciphertext;

  function submitDocument(bytes calldata data) external {
    // Document encrypted with BLS threshold key
    BITE.Ciphertext memory ct = BITE.encrypt(
      data, dealPublicKey, threshold
    );

    // Only AI agent can request CTX decryption
    require(authorizedAgent(msg.sender), "!agent");

    documents[docId] = ct;
    emit DocumentEncrypted(docId, ct.hash);
  }

  function requestAnalysis(uint256 docId)
    external onlyAgent returns (bytes memory)
  {
    // CTX: Decrypt inside consensus for agent
    BITE.Ciphertext memory ct = documents[docId];
    return BITE.conditionalDecrypt(ct, msg.sender);
  }
}`;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export function PrivacyFlowDiagram() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Privacy-Preserving{" "}
          <span className="text-teal-400">Analysis Flow</span>
        </h2>
        <p className="text-center text-slate-400 mb-14 max-w-xl mx-auto">
          Documents stay encrypted at every stage. AI agents access data only
          through SKALE&apos;s Conditional Transactions.
        </p>

        {/* Steps */}
        <div className="relative flex items-center justify-between gap-2 mb-6 overflow-x-auto pb-4">
          {/* Connector line */}
          <div className="absolute top-8 left-0 right-0 h-px bg-slate-800 hidden lg:block" />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="absolute top-8 left-0 h-px bg-emerald-500 hidden lg:block"
              initial={{ width: "0%" }}
              animate={{
                width: `${(activeStep / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </AnimatePresence>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex w-full justify-between gap-3 lg:gap-0"
          >
            {steps.map((step, i) => {
              const isActive = i <= activeStep;
              const isCurrent = i === activeStep;
              return (
                <motion.div
                  key={step.label}
                  variants={item}
                  className="flex flex-col items-center text-center min-w-[100px] lg:min-w-0 relative z-10"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isCurrent
                        ? "border-emerald-400 bg-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                        : isActive
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <step.icon
                      className={`w-6 h-6 ${
                        isCurrent ? "text-emerald-300" : isActive ? "text-emerald-500/70" : "text-slate-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`mt-3 text-sm font-medium ${
                      isCurrent ? "text-emerald-300" : isActive ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 text-xs text-slate-400 max-w-[120px]"
                    >
                      {step.desc}
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Terminal code block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-12 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-slate-500 font-mono">
              DealRoom.sol — BITE Encryption Pattern
            </span>
          </div>
          <pre className="p-5 overflow-x-auto text-sm leading-relaxed font-mono text-slate-300">
            <code>{codeBlock}</code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
