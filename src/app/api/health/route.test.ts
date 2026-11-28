import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("health route", () => {
  it("reports the deployed commit and configured AI state without exposing the key", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123");
    vi.stubEnv("GEMINI_API_KEY", "a-private-api-key");
    const response = await GET();

    expect(await response.json()).toEqual({
      commit: "abc123",
      ai: "configured",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("reports missing AI configuration for an empty or placeholder key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "your_gemini_api_key_here");
    expect(await (await GET()).json()).toMatchObject({ ai: "missing" });
  });
});
