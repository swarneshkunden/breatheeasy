import { NextRequest, NextResponse } from "next/server";
import { aiRequestSchema, clientIp } from "@/lib/security/validation";
import {
  checkRateLimit,
  AI_LIMITS,
} from "@/lib/security/distributed-rate-limit";
import { csrfGuard } from "@/lib/security/csrf";
import { generateAiPlan } from "@/lib/ai/plan-service";
import type { AiPlanInput } from "@/lib/ai/plan-service";

export const maxDuration = 20;

const MAX_REQUEST_BODY_BYTES = 16000;

async function readBodyWithLimit(
  request: NextRequest,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  // Early rejection via Content-Length when available.
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const len = Number.parseInt(contentLength, 10);
    if (!Number.isFinite(len) || len <= 0 || len > maxBytes) {
      return { ok: false, status: 413 };
    }
  }

  // Stream-read the body enforcing a hard byte cap regardless of declared length.
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, status: 413 };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  let released = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          reader.releaseLock();
          released = true;
          return { ok: false, status: 413 };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    if (!released) {
      reader.releaseLock();
    }
  }

  return { ok: true, text: new TextDecoder().decode(Buffer.concat(chunks)) };
}

export async function POST(request: NextRequest) {
  const csrfResponse = csrfGuard(request);
  if (csrfResponse) return csrfResponse;

  const ip = clientIp(request);
  const limit = await checkRateLimit(ip, AI_LIMITS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retry) } },
    );
  }

  if (
    request.headers.get("content-type")?.includes("application/json") !== true
  ) {
    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 415 },
    );
  }

  const bodyResult = await readBodyWithLimit(request, MAX_REQUEST_BODY_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = aiRequestSchema.safeParse(body);

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const input: AiPlanInput = parsed.data;
  const result = await generateAiPlan(input);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=0, no-cache" },
  });
}
