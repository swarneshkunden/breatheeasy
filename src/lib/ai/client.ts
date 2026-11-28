import type { AiClient } from "./types";
import { validateGeminiResponse } from "./gemini-validation";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;

const adviceTipSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    detail: { type: "string" },
    impact: { type: "string" },
    score: { type: "number", minimum: 0, maximum: 100 },
  },
  required: ["title", "detail", "impact", "score"],
} as const;
const adviceResponseSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    tips: { type: "array", items: { type: "string" } },
    followUps: { type: "array", items: { type: "string" } },
    lowEmission: { type: "array", items: adviceTipSchema },
    indoor: { type: "array", items: adviceTipSchema },
    sustainable: { type: "array", items: adviceTipSchema },
  },
  required: [
    "answer",
    "tips",
    "followUps",
    "lowEmission",
    "indoor",
    "sustainable",
  ],
} as const;

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

  async generate(prompt: string, systemInstruction: string): Promise<string> {
    if (!this.apiKey) throw new Error("AI client not configured");
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await this.generateOnce(prompt, systemInstruction, this.apiKey);
      } catch (error) {
        if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  private async generateOnce(
    prompt: string,
    systemInstruction: string,
    apiKey: string,
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: adviceResponseSchema,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new GeminiHttpError(response.status);
      const payload = validateGeminiResponse(await response.json());
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty AI response");
      return text;
    } catch (error) {
      const isAbortError =
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError";
      if (controller.signal.aborted || isAbortError) {
        throw new GeminiTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

function isRetryable(error: unknown): boolean {
  return (
    error instanceof GeminiTimeoutError ||
    (error instanceof GeminiHttpError &&
      (error.status === 408 || error.status === 429 || error.status >= 500))
  );
}
