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
    "pdfjs-dist"
  ],
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
