import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "BreatheEasy", timestamp: new Date().toISOString() });
}
