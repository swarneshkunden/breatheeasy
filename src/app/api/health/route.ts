import { NextResponse } from "next/server";

export function GET() {
  const key = process.env.GEMINI_API_KEY?.trim() ?? "";
  const configured = key.length > 0 && !/^your_.+_here$/i.test(key);
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "unknown";
  return NextResponse.json(
    { commit, ai: configured ? "configured" : "missing" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
