interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class BoundedCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    const now = Date.now();
    if (entry.expiry <= now) {
      this.map.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    const now = Date.now();
    // Evict expired entries first.
    for (const [k, entry] of this.map) {
      if (entry.expiry <= now) {
        this.map.delete(k);
      }
    }
    // Enforce max size: evict oldest entry if at capacity.
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, { data, expiry: now + this.ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    let count = 0;
    const now = Date.now();
    for (const [k, entry] of this.map) {
      if (entry.expiry > now) count += 1;
      else this.map.delete(k);
    }
    return count;
  }
}
