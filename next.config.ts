import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['chalk'],
  devIndicators: false,
  logging: {
    incomingRequests: false,
  },
};

export default nextConfig;
