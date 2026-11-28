interface WindowEntry {
  count: number;
  resetAt: number;
}

const MAX_WINDOWS = 10_000;
const windows = new Map<string, WindowEntry>();

function pruneExpired(now: number): void {
  for (const [ip, entry] of windows) {
    if (entry.resetAt <= now) {
      windows.delete(ip);
    }
  }
}

function enforceMaxSize(): void {
  if (windows.size <= MAX_WINDOWS) return;
  // Evict oldest entries (by resetAt) to stay under limit.
  const entries = Array.from(windows.entries()).sort(
    ([, a], [, b]) => a.resetAt - b.resetAt,
  );
  const toEvict = entries.slice(0, windows.size - MAX_WINDOWS);
  for (const [ip] of toEvict) {
    windows.delete(ip);
  }
}

export function checkRateLimit(
  ip: string,
  limit = 10,
  windowMs = 60_000,
): {
  allowed: boolean;
  retry: number;
} {
  const now = Date.now();
  pruneExpired(now);
  enforceMaxSize();

  const entry = windows.get(ip);
  if (!entry || entry.resetAt <= now) {
    windows.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retry: Math.ceil(windowMs / 1000) };
  }
  if (entry.count >= limit) {
    return { allowed: false, retry: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retry: Math.ceil((entry.resetAt - now) / 1000) };
}
