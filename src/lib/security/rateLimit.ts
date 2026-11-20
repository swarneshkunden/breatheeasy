const windows = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): {
  allowed: boolean;
  retry: number;
} {
  const now = Date.now();
  const entry = windows.get(ip);
  if (!entry || entry.resetAt <= now) {
    windows.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retry: Math.ceil(windowMs / 1000) };
  }
  if (entry.count >= limit) return { allowed: false, retry: Math.ceil((entry.resetAt - now) / 1000) };
  entry.count += 1;
  return { allowed: true, retry: Math.ceil((entry.resetAt - now) / 1000) };
}
