import type { NextConfig } from "next";

function getApiImagePattern() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const parsed = new URL(apiUrl);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: "/cdn/**",
    };
  } catch {
    return null;
  }
}

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

function buildContentSecurityPolicy(isDev: boolean) {
  const apiOrigin = getApiOrigin();
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://connect.facebook.net",
    "https://analytics.tiktok.com",
    "https://cdn.utmify.com.br",
    "https://client.crisp.chat",
    "https://embed.tawk.to",
    "https://*.chatwoot.com",
  ];

  const connectSrc = [
    "'self'",
    ...(apiOrigin ? [apiOrigin] : []),
    "https://www.google-analytics.com",
    "https://analytics.tiktok.com",
    "https://client.crisp.chat",
    "wss:",
    ...(isDev ? ["ws:", "http://localhost:*", "http://127.0.0.1:*"] : []),
  ];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https:",
    ...(isDev ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${imgSrc.join(" ")}`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src 'self' https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

const apiImagePattern = getApiImagePattern();
const isDev = process.env.NODE_ENV === "development";

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
      {
        protocol: "https",
        hostname: "spacepoint.shop",
        pathname: "/cdn/**",
      },
      ...(apiImagePattern ? [apiImagePattern] : []),
      {
        protocol: "https",
        hostname: "**.ngrok-free.app",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "**.ngrok.app",
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
  async headers() {
    const csp = buildContentSecurityPolicy(isDev);

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
