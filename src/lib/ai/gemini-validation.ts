import { z } from "zod";

const geminiPartSchema = z.object({
  text: z.string().optional(),
});

const geminiContentSchema = z.object({
  parts: z.array(geminiPartSchema).optional(),
});

const geminiCandidateSchema = z.object({
  content: geminiContentSchema.optional(),
});

export const geminiResponseSchema = z.object({
  candidates: z.array(geminiCandidateSchema).optional(),
});

export type ValidatedGeminiResponse = z.infer<typeof geminiResponseSchema>;

export function validateGeminiResponse(data: unknown): ValidatedGeminiResponse {
  const result = geminiResponseSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid Gemini response");
  return result.data;
}
