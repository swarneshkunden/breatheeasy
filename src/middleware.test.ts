import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("content security policy middleware", () => {
  it("forwards the nonce policy to Next.js and the browser", () => {
    const response = middleware(
      new NextRequest("https://breatheeasy.example/app"),
    );
    const policy = response.headers.get("Content-Security-Policy");

    expect(policy).toMatch(
      /script-src 'self' 'nonce-[a-f0-9]+' 'strict-dynamic'/,
    );
    expect(
      response.headers.get("x-middleware-request-content-security-policy"),
    ).toBe(policy);
    expect(response.headers.get("x-middleware-override-headers")).toContain(
      "content-security-policy",
    );
  });
});
