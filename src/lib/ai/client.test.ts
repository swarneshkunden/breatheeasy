import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiAiClient } from "./client";

describe("GeminiAiClient", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when no API key is configured", async () => {
    const client = new GeminiAiClient(undefined);
    await expect(
      client.generate("prompt", "system instruction"),
    ).rejects.toThrow("AI client not configured");
  });

  it("returns the AI text on success", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "hello" }] } }],
        }),
        { status: 200 },
      ),
    );

    const client = new GeminiAiClient("test-key");
    const text = await client.generate("prompt", "system instruction");
    expect(text).toBe("hello");
    const requestBody = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(requestBody.generationConfig.responseJsonSchema.required).toEqual([
      "answer",
      "tips",
      "followUps",
      "lowEmission",
      "indoor",
      "sustainable",
    ]);
    expect(requestBody.systemInstruction.parts[0].text).toBe(
      "system instruction",
    );
    expect(requestBody.generationConfig.thinkingConfig.thinkingLevel).toBe(
      "minimal",
    );
  });

  it("throws when response is empty", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [],
        }),
        { status: 200 },
      ),
    );

    const client = new GeminiAiClient("test-key");
    await expect(
      client.generate("prompt", "system instruction"),
    ).rejects.toThrow("Empty AI response");
  });

  it("throws on non-OK HTTP status", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("oops", { status: 400 }));

    const client = new GeminiAiClient("test-key");
    await expect(
      client.generate("prompt", "system instruction"),
    ).rejects.toMatchObject({ name: "GeminiHttpError", status: 400 });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("retries one transient provider 503 response", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response("temporarily unavailable", { status: 503 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "hello" }] } }],
          }),
          { status: 200 },
        ),
      );

    const client = new GeminiAiClient("test-key");
    await expect(client.generate("prompt", "system instruction")).resolves.toBe(
      "hello",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("aborts long-running requests", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    fetchSpy
      .mockRejectedValueOnce(abortError)
      .mockRejectedValueOnce(abortError);

    const client = new GeminiAiClient("test-key");
    await expect(
      client.generate("prompt", "system instruction"),
    ).rejects.toMatchObject({ name: "GeminiTimeoutError" });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("uses an eight-second provider timeout and makes exactly one retry", async () => {
    vi.useFakeTimers();
    fetchSpy.mockImplementation(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );

    try {
      const client = new GeminiAiClient("test-key");
      const request = client.generate("prompt", "system instruction");
      const rejection = expect(request).rejects.toMatchObject({
        name: "GeminiTimeoutError",
      });
      await vi.advanceTimersByTimeAsync(8_000);
      await vi.advanceTimersByTimeAsync(250);
      await vi.advanceTimersByTimeAsync(8_000);
      await rejection;
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
