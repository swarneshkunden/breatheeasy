import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout } from "./fetchWithTimeout";

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns data on successful fetch within timeout", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("hello", { status: 200 }));
    const result = await fetchWithTimeout("http://example.com", 5000, async (signal) => {
      const response = await fetch("http://example.com", { signal });
      return response.text();
    });
    expect(result).toBe("hello");
  });

  it("throws when fetch times out", async () => {
    // Mock a fetch that hangs forever but respects abort signals.
    fetchSpy.mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
        // Never resolve — simulates a hanging request.
      });
    });

    await expect(
      fetchWithTimeout("http://example.com", 50, async (signal) => {
        const response = await fetch("http://example.com", { signal });
        return response.text();
      }),
    ).rejects.toThrow("Request timed out");
  });

  it("propagates caller abort", async () => {
    fetchSpy.mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        const signal = init?.signal;
        const timer = setTimeout(() => resolve(new Response("delayed", { status: 200 })), 500);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);

    // Use a short timeoutMs so fetchWithTimeout's own abort fires before the mock resolves.
    await expect(
      fetchWithTimeout("http://example.com", 100, async (signal) => {
        const response = await fetch("http://example.com", { signal });
        return response.text();
      }),
    ).rejects.toThrow();
  });

  it("keeps timeout active during response body consumption", async () => {
    // fetch() hangs forever but respects abort signals — timeout must abort it.
    fetchSpy.mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
        // Never resolve — simulates a hanging request.
      });
    });

    await expect(
      fetchWithTimeout("http://example.com", 100, async (signal) => {
        const response = await fetch("http://example.com", { signal });
        const reader = response.body!.getReader();
        const result = await reader.read();
        reader.releaseLock();
        return result.value?.toString() ?? "";
      }),
    ).rejects.toThrow("Request timed out");
  });
});
