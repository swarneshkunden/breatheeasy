import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { validateAiOutput } from "./output-validation";
import { validateGeminiResponse } from "./gemini-validation";
import { generateAiPlan } from "./plan-service";
import type { AiPlanInput } from "./plan-service";

const baseInput: AiPlanInput = {
  message: "Is it safe to go outside?",
  language: "en",
  latitude: 28.61,
  longitude: 77.23,
  currentAqi: 150,
  pm25: 85,
  hourly: [],
  utcOffsetSeconds: 0,
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

describe("AI output validation", () => {
  it("accepts valid AI output", () => {
    const valid = JSON.stringify({
      answer: "Use filtered indoor air.",
      tips: ["When can I open windows?"],
      followUps: ["How should I commute?"],
      lowEmission: [
        {
          title: "Walk",
          detail: "Walk more",
          impact: "Less emissions",
          score: 90,
        },
      ],
      indoor: [
        {
          title: "Purifier",
          detail: "Use purifier",
          impact: "Cleaner air",
          score: 85,
        },
      ],
      sustainable: [
        {
          title: "Metro",
          detail: "Take metro",
          impact: "Less car use",
          score: 95,
        },
      ],
    });
    const result = validateAiOutput(valid);
    expect(result.lowEmission.length).toBe(1);
    expect(result.indoor.length).toBe(1);
    expect(result.sustainable.length).toBe(1);
  });

  it("rejects malformed JSON", () => {
    expect(() => validateAiOutput("not json")).toThrow("Invalid AI response");
  });

  it("rejects missing sections", () => {
    const incomplete = JSON.stringify({
      lowEmission: [],
      indoor: [],
      sustainable: [],
    });
    expect(() => validateAiOutput(incomplete)).toThrow("Invalid AI response");
  });

  it("rejects invalid scores", () => {
    const badScore = JSON.stringify({
      lowEmission: [{ title: "x", detail: "y", impact: "z", score: 150 }],
      indoor: [{ title: "x", detail: "y", impact: "z", score: 50 }],
      sustainable: [{ title: "x", detail: "y", impact: "z", score: 50 }],
    });
    expect(() => validateAiOutput(badScore)).toThrow("Invalid AI response");
  });
});

describe("Gemini response validation", () => {
  it("accepts valid Gemini response", () => {
    const valid = { candidates: [{ content: { parts: [{ text: "hello" }] } }] };
    const result = validateGeminiResponse(valid);
    expect(result.candidates?.[0]?.content?.parts?.[0]?.text).toBe("hello");
  });

  it("rejects empty candidates", () => {
    const result = validateGeminiResponse({});
    expect(result.candidates).toBeUndefined();
  });

  it("rejects missing parts", () => {
    const result = validateGeminiResponse({ candidates: [{ content: {} }] });
    expect(result.candidates?.[0]?.content?.parts).toBeUndefined();
  });
});

describe("generateAiPlan fallback behavior", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) process.env.GEMINI_API_KEY = originalEnv;
    else delete process.env.GEMINI_API_KEY;
  });

  it("falls back to offline plan when API key missing", async () => {
    const result = await generateAiPlan(baseInput);
    expect(result.smartMode).toBe("offline");
    expect(result.smartModeReason).toBe("missing_api_key");
    expect(result.lowEmission.length).toBeGreaterThan(0);
  });

  it("falls back to offline plan when API key is placeholder", async () => {
    process.env.GEMINI_API_KEY = "your_key_here";
    const result = await generateAiPlan(baseInput);
    expect(result.smartMode).toBe("offline");
    expect(result.smartModeReason).toBe("missing_api_key");
  });

  it("includes fallback advice tips", async () => {
    process.env.GEMINI_API_KEY = undefined;
    const result = await generateAiPlan(baseInput);
    expect(
      result.lowEmission.some(
        (t) => t.title.includes("metro") || t.title.includes("trip"),
      ),
    ).toBe(true);
    expect(
      result.indoor.some(
        (t) => t.title.includes("Purifier") || t.title.includes("Ventilate"),
      ),
    ).toBe(true);
  });
});
