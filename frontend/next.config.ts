import type { NextConfig } from "next";
import dotenv from "dotenv";

const port = process.env.BACKEND_PORT || 5000;
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${port}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `http://localhost:${port}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
