export async function fetchWithTimeout(
  url: string | URL,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    return response;
  } catch {
    clearTimeout(timeout);
    throw new Error("Request timed out");
  }
}
