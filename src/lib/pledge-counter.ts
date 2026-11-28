const STORAGE_KEY = "breatheeasy-pledge-count";

export function readPledgeCount(storage: Pick<Storage, "getItem">): number {
  const parsed = Number.parseInt(storage.getItem(STORAGE_KEY) ?? "0", 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function incrementPledgeCount(
  storage: Pick<Storage, "getItem" | "setItem">,
): number {
  const next = readPledgeCount(storage) + 1;
  storage.setItem(STORAGE_KEY, String(next));
  return next;
}
