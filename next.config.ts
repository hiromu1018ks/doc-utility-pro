import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化設定
  images: {
    // 外部画像ドメイン（必要に応じて追加）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },

  // ロギング
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
