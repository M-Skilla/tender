import type { Metadata } from "next";
import { Public_Sans, Source_Code_Pro, Source_Serif_4 } from "next/font/google";
import "@/styles/globals.css";

// Self-hosted at build time by next/font; exposed as CSS variables that tokens.css reads.
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif-4", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const mono = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code-pro", display: "swap" });

export const metadata: Metadata = {
  title: "Tender Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
