import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "skiper-ui.com",
      },
      {
        protocol: "https",
        hostname: "i.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media4.giphy.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
