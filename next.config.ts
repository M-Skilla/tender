import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep next dev from appending its own block to the project's CLAUDE.md.
  agentRules: false,
  // Tender and bid documents are uploaded through server actions (stored on disk, hashed in AmanaDB).
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

export default nextConfig;
