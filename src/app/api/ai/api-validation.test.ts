import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

const originalEnv = process.env.GEMINI_API_KEY;
const originalRedis = process.env.UPSTASH_REDIS_REST_URL;
const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  if (originalEnv !== undefined) process.env.GEMINI_API_KEY = originalEnv;
  else delete process.env.GEMINI_API_KEY;
  if (originalRedis !== undefined) process.env.UPSTASH_REDIS_REST_URL = originalRedis;
  else delete process.env.UPSTASH_REDIS_REST_URL;
  if (originalToken !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  else delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  message: "Is it safe?",
  language: "en",
  latitude: 28.61,
  longitude: 77.23,
  currentAqi: 150,
  pm25: 85,
  profile: {
    members: ["kids", "adults"],
    homeType: "apartment",
    hasAc: true,
    hasPurifier: false,
    windows: "sealed",
    commute: "metro",
    cooking: "lpg",
    budget: "medium",
  },
};

describe("AI API route - validation", () => {
  it("rejects invalid content type", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: { "content-type": "text/plain", origin: "http://localhost:3000" },
      body: "hello",
    });
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("rejects oversized body", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: "x".repeat(20000),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("rejects malformed JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects missing required fields", async () => {
    const res = await POST(makeRequest({ message: "hi" }));
    expect(res.status).toBe(400);
  });

  it("accepts valid request and returns fallback plan", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.smartMode).toBe("offline");
    expect(data.smartModeReason).toBe("missing_api_key");
    expect(Array.isArray(data.lowEmission)).toBe(true);
  });
});

describe("AI API route - CSRF", () => {
  it("returns 403 for missing origin header", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
