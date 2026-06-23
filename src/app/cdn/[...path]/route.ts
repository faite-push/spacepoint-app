import { NextRequest, NextResponse } from "next/server";

const API_TARGET = (process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!API_TARGET || API_TARGET.startsWith("/")) {
    return NextResponse.json({ error: "CDN proxy não configurado" }, { status: 502 });
  }

  const target = `${API_TARGET}/cdn/${path.join("/")}${req.nextUrl.search}`;

  try {
    const upstream = await fetch(target, {
      headers: { "ngrok-skip-browser-warning": "true" },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar mídia" }, { status: 502 });
  }
}
