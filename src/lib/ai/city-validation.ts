import { z } from "zod";

export const cityResultSchema = z.object({
  name: z.string(),
  admin1: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

export type ValidatedCityResult = z.infer<typeof cityResultSchema>;

export function validateCityResults(data: unknown): ValidatedCityResult[] {
  const results = z.array(cityResultSchema).safeParse(data);
  if (!results.success) throw new Error("Invalid city results response");
  return results.data;
}
