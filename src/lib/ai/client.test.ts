import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiAiClient } from "./client";

describe("GeminiAiClient", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchSpy = vi.fn() as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.fetch = fetchSpy as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when no API key is configured", async () => {
    const client = new GeminiAiClient(undefined);
    await expect(client.generate("prompt")).rejects.toThrow("AI client not configured");
  });

  it("returns the AI text on success", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "hello" }] } }],
    }), { status: 200 }));

    const client = new GeminiAiClient("test-key");
    const text = await client.generate("prompt");
    expect(text).toBe("hello");
  });

  it("throws when response is empty", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({
      candidates: [],
    }), { status: 200 }));

    const client = new GeminiAiClient("test-key");
    await expect(client.generate("prompt")).rejects.toThrow("Empty AI response");
  });

  it("throws on non-OK HTTP status", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("oops", { status: 400 }));

    const client = new GeminiAiClient("test-key");
    await expect(client.generate("prompt")).rejects.toMatchObject({ name: "GeminiHttpError", status: 400 });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("retries transient provider 503 responses twice", async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response("temporarily unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("temporarily unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "hello" }] } }],
      }), { status: 200 }));

    const client = new GeminiAiClient("test-key");
    await expect(client.generate("prompt")).resolves.toBe("hello");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("aborts long-running requests", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    fetchSpy.mockRejectedValueOnce(abortError).mockRejectedValueOnce(abortError).mockRejectedValueOnce(abortError);

    const client = new GeminiAiClient("test-key");
    await expect(client.generate("prompt")).rejects.toMatchObject({ name: "GeminiTimeoutError" });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});