import { z } from "zod";

export const cityResultSchema = z.object({
  name: z.string(),
  admin1: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

export const cityResponseSchema = z.object({
  results: z.array(cityResultSchema),
});

export type ValidatedCityResult = z.infer<typeof cityResultSchema>;
export type ValidatedCityResponse = z.infer<typeof cityResponseSchema>;

export function validateCityResponse(data: unknown): ValidatedCityResponse {
  const result = cityResponseSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid city results response");
  return result.data;
}

export function validateCityResults(data: unknown): ValidatedCityResult[] {
  return validateCityResponse(data).results;
}
