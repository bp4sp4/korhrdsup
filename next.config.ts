import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 빌드 시 TypeScript 오류 무시
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 오류 무시
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
