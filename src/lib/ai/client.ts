import type { AiClient } from "./types";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";
const REQUEST_TIMEOUT_MS = 25_000;

export class GeminiHttpError extends Error {
  constructor(readonly status: number) {
    super("Gemini request failed");
    this.name = "GeminiHttpError";
  }
}

export class GeminiTimeoutError extends Error {
  constructor() {
    super("Gemini request timed out");
    this.name = "GeminiTimeoutError";
  }
}

export class GeminiAiClient implements AiClient {
  constructor(private readonly apiKey: string | undefined) {}

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error("AI client not configured");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new GeminiHttpError(response.status);
      const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty AI response");
      return text;
    } catch (error) {
      const isAbortError = typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
      if (controller.signal.aborted || isAbortError) {
        throw new GeminiTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
