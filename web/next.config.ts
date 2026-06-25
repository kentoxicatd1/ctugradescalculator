import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdfjs-dist"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: "./src/lib/empty.ts",
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/empty.ts",
    },
  },
};

export default nextConfig;
