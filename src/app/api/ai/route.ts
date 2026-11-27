import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkDistributedRateLimit } from "@/lib/security/distributed-rate-limit";
import { csrfGuard } from "@/lib/security/csrf";
import { generateAiPlan } from "@/lib/ai/plan-service";
import type { AiPlanInput } from "@/lib/ai/plan-service";

export const maxDuration = 70;

const requestSizeLimit = 16000;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: NextRequest) {
  const csrfResponse = csrfGuard(request);
  if (csrfResponse) return csrfResponse;

  const ip = clientIp(request);
  const limit = await checkDistributedRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retry) } });
  }

  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > requestSizeLimit) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = z.object({
    message: z.string().trim().min(1).max(1200),
    language: z.enum(["en", "hi"]),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    currentAqi: z.number().int().min(0).max(1000),
    pm25: z.number().min(0).max(2000),
    profile: z.object({
      members: z.array(z.enum(["kids", "elderly", "pregnant", "respiratory", "adults"])).max(5),
      homeType: z.enum(["apartment", "house"]),
      hasAc: z.boolean(),
      hasPurifier: z.boolean(),
      windows: z.enum(["sealed", "normal"]),
      commute: z.enum(["walk", "bike", "two-wheeler", "car", "bus", "metro"]),
      cooking: z.enum(["lpg", "induction", "wood"]),
      budget: z.enum(["low", "medium", "high"]),
    }),
  }).safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const input: AiPlanInput = parsed.data;
  const result = await generateAiPlan(input);

  return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=0, no-cache" } });
}
