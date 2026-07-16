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

/** Origens extras (ex.: Chatwoot self-hosted). Separadas por vírgula. */
function getPluginCspExtraOrigins() {
  const raw =
    process.env.PLUGIN_CSP_EXTRA_ORIGINS ||
    process.env.NEXT_PUBLIC_PLUGIN_CSP_EXTRA_ORIGINS ||
    "";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter((s) => /^https?:\/\/[^\s]+$/i.test(s));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildContentSecurityPolicy(isDev: boolean) {
  const apiOrigin = getApiOrigin();
  const extraOrigins = getPluginCspExtraOrigins();

  const scriptSrc = unique([
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    // Google (Ads, Analytics, GTM)
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://tagmanager.google.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
    "https://www.google.com",
    // Meta / Facebook
    "https://connect.facebook.net",
    // TikTok
    "https://analytics.tiktok.com",
    // Utmify
    "https://cdn.utmify.com.br",
    // Crisp
    "https://client.crisp.chat",
    // Tawk
    "https://embed.tawk.to",
    "https://cdn.jsdelivr.net",
    // Chatwoot cloud + self-hosted via env
    "https://*.chatwoot.com",
    "https://app.chatwoot.com",
    ...extraOrigins,
  ]);

  const connectSrc = unique([
    "'self'",
    ...(apiOrigin ? [apiOrigin] : []),
    // Google
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://*.g.doubleclick.net",
    "https://stats.g.doubleclick.net",
    "https://www.google.com",
    "https://www.googleadservices.com",
    "https://pagead2.googlesyndication.com",
    // Meta / Facebook
    "https://www.facebook.com",
    "https://connect.facebook.net",
    "https://graph.facebook.com",
    // TikTok
    "https://analytics.tiktok.com",
    "https://*.tiktok.com",
    "https://business-api.tiktok.com",
    // Utmify
    "https://cdn.utmify.com.br",
    "https://*.utmify.com.br",
    // Crisp
    "https://client.crisp.chat",
    "https://*.crisp.chat",
    "wss://client.relay.crisp.chat",
    "wss://*.crisp.chat",
    // Tawk
    "https://*.tawk.to",
    "wss://*.tawk.to",
    // Chatwoot
    "https://*.chatwoot.com",
    "https://app.chatwoot.com",
    "wss://*.chatwoot.com",
    ...extraOrigins,
    ...extraOrigins.map((o) => o.replace(/^http/i, "ws")),
    "wss:",
    ...(isDev ? ["ws:", "http://localhost:*", "http://127.0.0.1:*"] : []),
  ]);

  const frameSrc = unique([
    "'self'",
    "https://www.googletagmanager.com",
    "https://td.doubleclick.net",
    "https://www.facebook.com",
    "https://*.facebook.com",
    "https://game.crisp.chat",
    "https://*.tawk.to",
    "https://*.chatwoot.com",
    "https://app.chatwoot.com",
    ...extraOrigins,
  ]);

  const styleSrc = unique([
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://www.googletagmanager.com",
    "https://tagmanager.google.com",
    "https://*.tawk.to",
    "https://cdn.jsdelivr.net",
    "https://client.crisp.chat",
  ]);

  const fontSrc = unique([
    "'self'",
    "data:",
    "https://fonts.gstatic.com",
    "https://client.crisp.chat",
    "https://*.tawk.to",
  ]);

  const imgSrc = unique([
    "'self'",
    "data:",
    "blob:",
    "https:",
    ...(isDev ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
  ]);

  const workerSrc = unique(["'self'", "blob:"]);

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    `font-src ${fontSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    `worker-src ${workerSrc.join(" ")}`,
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
