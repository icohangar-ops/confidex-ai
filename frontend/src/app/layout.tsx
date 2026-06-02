import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Confidex AI — Privacy-Preserving AI Deal Room on SKALE",
  description:
    "Confidential M&A deal rooms powered by SKALE BITE threshold encryption. AI agents perform due diligence on encrypted deal data. Built for SKALE Programmable Privacy Hackathon 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#060a12] text-slate-100`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
