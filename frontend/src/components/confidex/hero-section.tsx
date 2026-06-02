"use client";

import { motion } from "framer-motion";
import { Shield, Brain, Lock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "BITE Encryption",
    desc: "BLS threshold encryption on SKALE. No single party holds the decryption key.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
  {
    icon: Brain,
    title: "AI Due Diligence",
    desc: "GLM-4-Plus agents analyze encrypted data through Conditional Transactions.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: Lock,
    title: "Confidential Tokens",
    desc: "ERC-20 deal stake tokens with encrypted balances. Private transfers via CTX.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Eye,
    title: "Selective Disclosure",
    desc: "Time-bound per-document access. Auditors see only what they're authorized to.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#060a12] to-black">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400 consensus-pulse" />
            SKALE Programmable Privacy Hackathon 2026
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center text-5xl md:text-7xl font-bold tracking-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 drop-shadow-[0_0_30px_rgba(45,212,191,0.4)]">
            CONFIDEX AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 text-center text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Privacy-preserving M&amp;A deal rooms on SKALE. Documents stay encrypted.
          AI agents perform due diligence through threshold decryption. Zero
          information leakage.
        </motion.p>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={item}>
              <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors h-full">
                <CardContent className="p-5">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${f.bg} mb-3`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Hackathon dates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-16 text-center"
        >
          <span className="text-xs text-slate-500 tracking-wide uppercase">
            SKALE Hackathon 2026 &nbsp;|&nbsp; June 1 — July 1, 2026
          </span>
        </motion.div>
      </div>
    </section>
  );
}
