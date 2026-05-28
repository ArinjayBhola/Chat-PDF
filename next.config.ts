import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "pdfjs-dist",
    "skia-canvas"
  ],
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }
    return config;
  },
};

export default nextConfig;
