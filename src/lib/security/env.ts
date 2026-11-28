import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(20).optional(),
  ),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export function validateEnvironment(environment: NodeJS.ProcessEnv) {
  const parsed = envSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error("Invalid server environment configuration.");
  }
  if (
    (parsed.data.UPSTASH_REDIS_REST_URL &&
      !parsed.data.UPSTASH_REDIS_REST_TOKEN) ||
    (!parsed.data.UPSTASH_REDIS_REST_URL &&
      parsed.data.UPSTASH_REDIS_REST_TOKEN)
  ) {
    throw new Error("Upstash rate limiting requires both REST URL and token.");
  }
  return parsed.data;
}
