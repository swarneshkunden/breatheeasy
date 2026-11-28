import { beforeEach, describe, expect, it } from "vitest";
import { incrementPledgeCount, readPledgeCount } from "./pledge-counter";

beforeEach(() => localStorage.clear());

describe("pledge counter persistence", () => {
  it("increments and reloads the stored pledge count", () => {
    expect(readPledgeCount(localStorage)).toBe(0);
    expect(incrementPledgeCount(localStorage)).toBe(1);
    expect(incrementPledgeCount(localStorage)).toBe(2);
    expect(readPledgeCount(localStorage)).toBe(2);
  });

  it("treats malformed or negative stored values as zero", () => {
    localStorage.setItem("breatheeasy-pledge-count", "-4");
    expect(readPledgeCount(localStorage)).toBe(0);
    localStorage.setItem("breatheeasy-pledge-count", "not-a-number");
    expect(readPledgeCount(localStorage)).toBe(0);
  });
});
