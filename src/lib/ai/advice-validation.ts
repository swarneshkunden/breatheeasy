import { z } from "zod";

export const adviceTipSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(500),
  impact: z.string().min(1).max(300),
  score: z.number().int().min(0).max(100),
});

export const advicePlanSchema = z.object({
  answer: z.string().min(1).max(1200),
  tips: z.array(z.string().min(1).max(200)).max(8),
  followUps: z.array(z.string().min(1).max(200)).max(8),
  lowEmission: z.array(adviceTipSchema),
  indoor: z.array(adviceTipSchema),
  sustainable: z.array(adviceTipSchema),
  smartMode: z.enum(["live", "offline"]),
  smartModeReason: z
    .enum([
      "missing_api_key",
      "provider_auth",
      "model_unavailable",
      "quota_or_rate_limit",
      "timeout",
      "invalid_response",
      "provider_error",
      "network_error",
    ])
    .optional(),
  smartModeStatus: z.number().optional(),
});

export type ValidatedAdvicePlan = z.infer<typeof advicePlanSchema>;

export function validateAdvicePlan(data: unknown): ValidatedAdvicePlan {
  const result = advicePlanSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid advice plan response");
  return result.data;
}
