import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/cdn/**",
      },
    ],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/admin/:path*",
        destination: "/dashboard/admin/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
