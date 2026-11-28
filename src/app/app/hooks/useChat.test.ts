import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoAir } from "@/lib/air/demo";
import { useChat } from "./useChat";
import type { HouseholdProfile } from "@/lib/types";

const profile: HouseholdProfile = {
  members: ["kids"],
  homeType: "apartment",
  hasAc: false,
  hasPurifier: false,
  windows: "normal",
  commute: "walk",
  cooking: "lpg",
  budget: "low",
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useChat request timeout", () => {
  it("aborts the client fetch at 12 seconds and falls back to question-specific rules", async () => {
    vi.useFakeTimers();
    const onPlanReceived = vi.fn();
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          requestSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      }),
    );
    const { result } = renderHook(() =>
      useChat({
        language: "en",
        current: demoAir,
        profile,
        onPlanReceived,
      }),
    );

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.sendChat("Can I open the windows?");
    });
    await vi.advanceTimersByTimeAsync(12_000);
    await pending;

    expect(requestSignal?.aborted).toBe(true);
    expect(onPlanReceived).toHaveBeenCalledWith(
      expect.objectContaining({
        smartMode: "offline",
        smartModeReason: "timeout",
        answer: expect.stringContaining("Keep windows closed"),
      }),
    );
  });
});
