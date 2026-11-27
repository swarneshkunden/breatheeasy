import { describe, expect, it } from "vitest";
import { BoundedCache } from "./bounded-cache";

describe("BoundedCache", () => {
  it("stores and retrieves values", () => {
    const cache = new BoundedCache<string>(3, 60_000);
    cache.set("a", "1");
    expect(cache.get("a")).toBe("1");
  });

  it("returns undefined for missing keys", () => {
    const cache = new BoundedCache<string>(3, 60_000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after TTL", () => {
    const cache = new BoundedCache<string>(3, 50);
    cache.set("a", "1");
    expect(cache.get("a")).toBe("1");
    // Wait for TTL to expire.
    const start = Date.now();
    while (Date.now() - start < 60) {
      // Busy wait for test timing.
    }
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts least recently used entry when at capacity", () => {
    const cache = new BoundedCache<string>(2, 60_000);
    cache.set("a", "1");
    cache.set("b", "2");
    // Access "a" to make it recently used.
    cache.get("a");
    // "b" is now LRU, should be evicted.
    cache.set("c", "3");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("1");
    expect(cache.get("c")).toBe("3");
  });

  it("updates existing key and moves to recently used", () => {
    const cache = new BoundedCache<string>(2, 60_000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("a", "updated");
    // "b" is LRU, should be evicted.
    cache.set("c", "3");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("updated");
    expect(cache.get("c")).toBe("3");
  });

  it("enforces max size", () => {
    const cache = new BoundedCache<string>(3, 60_000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.size()).toBe(3);
    cache.set("d", "4");
    expect(cache.size()).toBe(3);
    expect(cache.get("a")).toBeUndefined(); // "a" was LRU
  });

  it("removes expired entries on access", () => {
    const cache = new BoundedCache<string>(3, 50);
    cache.set("a", "1");
    const start = Date.now();
    while (Date.now() - start < 60) {
      // Busy wait.
    }
    // Accessing expired entry removes it and returns undefined.
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });
});
