export async function fetchWithTimeout<T>(
  url: string | URL,
  timeoutMs: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fn(controller.signal);
  } catch (error) {
    const isAbort = typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
    if (controller.signal.aborted || isAbort) {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
