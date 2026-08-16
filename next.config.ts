import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      { source: "/field/report", destination: "/field/new", permanent: false },
      { source: "/field/report/incident", destination: "/field/incident", permanent: false },
      { source: "/field/report/near-miss", destination: "/field/near-miss", permanent: false },
      { source: "/field/report/hazard", destination: "/field/lmra", permanent: false },
      { source: "/field/hazard", destination: "/field/lmra", permanent: false },
    ];
  },
};

export default nextConfig;
