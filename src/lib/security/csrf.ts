import { NextRequest } from "next/server";

export function verifyOrigin(request: NextRequest, allowedOrigins?: string[]): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) {
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const allowed = allowedOrigins || [baseUrl];

  const checkUrl = origin || referer || "";
  try {
    const url = new URL(checkUrl);
    return allowed.some((allowedOrigin) => {
      const allowedUrl = new URL(allowedOrigin);
      return url.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
}

export function csrfGuard(request: NextRequest, allowedOrigins?: string[]): Response | null {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    if (!verifyOrigin(request, allowedOrigins)) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  return null;
}