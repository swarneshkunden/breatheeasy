import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { verifyOrigin, csrfGuard } from "@/lib/security/csrf";

describe("CSRF", () => {
  it("allows requests with matching origin", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(verifyOrigin(request)).toBe(true);
  });

  it("blocks requests with mismatched origin", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { origin: "http://evil.com" },
    });
    expect(verifyOrigin(request)).toBe(false);
  });

  it("blocks requests without origin header", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
    });
    expect(verifyOrigin(request)).toBe(false);
  });

  it("returns null for GET requests (safe methods)", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "GET",
    });
    expect(csrfGuard(request)).toBeNull();
  });

  it("returns 403 response for unsafe methods without valid origin", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
    });
    const response = csrfGuard(request);
    expect(response?.status).toBe(403);
  });

  it("returns null for unsafe methods with valid origin", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(csrfGuard(request)).toBeNull();
  });
});