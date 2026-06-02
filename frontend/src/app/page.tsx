"use client";

import dynamic from "next/dynamic";

const HeroSection = dynamic(
  () =>
    import("@/components/confidex/hero-section").then((m) => m.HeroSection),
  { ssr: false }
);
const PrivacyFlowDiagram = dynamic(
  () =>
    import("@/components/confidex/privacy-flow").then(
      (m) => m.PrivacyFlowDiagram
    ),
  { ssr: false }
);
const DealRoomDashboard = dynamic(
  () =>
    import("@/components/confidex/deal-room-dashboard").then(
      (m) => m.DealRoomDashboard
    ),
  { ssr: false }
);
const AIAnalysisPanel = dynamic(
  () =>
    import("@/components/confidex/ai-analysis-panel").then(
      (m) => m.AIAnalysisPanel
    ),
  { ssr: false }
);
const ContractExplorer = dynamic(
  () =>
    import("@/components/confidex/contract-explorer").then(
      (m) => m.ContractExplorer
    ),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060a12]">
      <HeroSection />
      <PrivacyFlowDiagram />
      <DealRoomDashboard />
      <AIAnalysisPanel />
      <ContractExplorer />
    </main>
  );
}
