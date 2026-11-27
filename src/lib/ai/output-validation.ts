import { z } from "zod";

const adviceTipSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(500),
  impact: z.string().min(1).max(300),
  score: z.number().int().min(0).max(100),
});

export const outputSchema = z.object({
  lowEmission: z.array(adviceTipSchema).min(1).max(10),
  indoor: z.array(adviceTipSchema).min(1).max(10),
  sustainable: z.array(adviceTipSchema).min(1).max(10),
});

export type ValidatedAiOutput = z.infer<typeof outputSchema>;

export function validateAiOutput(text: string): ValidatedAiOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid AI response");
  }
  const result = outputSchema.safeParse(parsed);
  if (!result.success) throw new Error("Invalid AI response");
  return result.data;
}
