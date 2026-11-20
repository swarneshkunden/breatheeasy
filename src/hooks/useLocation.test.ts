import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLocation } from "./useLocation";

const mockGetCurrentPosition = vi.fn();
const mockWatchPosition = vi.fn(() => 7);
const mockClearWatch = vi.fn();

function installGeolocation(secure = true) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: mockGetCurrentPosition,
      watchPosition: mockWatchPosition,
      clearWatch: mockClearWatch,
    },
  });
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: secure });
}

function fireSuccess(callback: (pos: GeolocationPosition) => void, latitude = 28.6139, longitude = 77.2099) {
  callback({
    coords: { latitude, longitude, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
  } as unknown as GeolocationPosition);
}

function fireError(callback: (err: GeolocationPositionError) => void, code: number) {
  callback({ code, message: "", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as unknown as GeolocationPositionError);
}

beforeEach(() => {
  mockGetCurrentPosition.mockClear();
  mockWatchPosition.mockClear();
  mockClearWatch.mockClear();
  installGeolocation(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLocation one-shot", () => {
  it("requests a position, rounds coords, and builds a label", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      result.current.requestLocation();
    });
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
    const success = mockGetCurrentPosition.mock.calls[0]?.[0];
    expect(success).toBeTypeOf("function");
    act(() => fireSuccess(success));
    expect(result.current.coords).toEqual({ latitude: 28.61, longitude: 77.21 });
    expect(result.current.label).toBe("Your location (28.61°N, 77.21°E)");
    expect(result.current.error).toBeNull();
  });

  it("calls onChange with rounded coords", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLocation({ onChange }));
    act(() => {
      result.current.requestLocation();
    });
    act(() => fireSuccess(mockGetCurrentPosition.mock.calls[0]?.[0]));
    expect(onChange).toHaveBeenCalledWith({ latitude: 28.61, longitude: 77.21 });
  });

  it("handles permission denied with a calm message", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      result.current.requestLocation();
    });
    act(() => fireError(mockGetCurrentPosition.mock.calls[0]?.[1], 1));
    expect(result.current.error).toContain("Enable it");
    expect(result.current.error).toContain("city");
  });

  it("handles position unavailable", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      result.current.requestLocation();
    });
    act(() => fireError(mockGetCurrentPosition.mock.calls[0]?.[1], 2));
    expect(result.current.error).toContain("unavailable");
  });

  it("handles timeout", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      result.current.requestLocation();
    });
    act(() => fireError(mockGetCurrentPosition.mock.calls[0]?.[1], 3));
    expect(result.current.error).toContain("timed out");
  });

  it("reports insecure context", () => {
    installGeolocation(false);
    const { result } = renderHook(() => useLocation());
    act(() => {
      result.current.requestLocation();
    });
    expect(result.current.error).toContain("secure connection");
  });
});

describe("useLocation follow toggle", () => {
  it("starts watching on follow and stops on unfollow", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      result.current.setFollowing(true);
    });
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    expect(result.current.following).toBe(true);
    act(() => {
      result.current.setFollowing(false);
    });
    expect(mockClearWatch).toHaveBeenCalledTimes(1);
    expect(result.current.following).toBe(false);
  });

  it("refetches only when moved more than 1 km", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLocation({ onChange }));
    act(() => {
      result.current.setFollowing(true);
    });
    const watchSuccess = mockWatchPosition.mock.calls[0]?.[0] as unknown as (pos: GeolocationPosition) => void;
    expect(watchSuccess).toBeTypeOf("function");
    // first position establishes baseline
    act(() => fireSuccess(watchSuccess, 28.61, 77.21));
    onChange.mockClear();
    // small move (< 1 km): no refetch
    act(() => fireSuccess(watchSuccess, 28.6101, 77.2101));
    expect(onChange).not.toHaveBeenCalled();
    // large move (> 1 km): refetch
    act(() => fireSuccess(watchSuccess, 28.63, 77.24));
    expect(onChange).toHaveBeenCalledWith({ latitude: 28.63, longitude: 77.24 });
  });

  it("clears watch on unmount", () => {
    const { result, unmount } = renderHook(() => useLocation());
    act(() => {
      result.current.setFollowing(true);
    });
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockClearWatch).toHaveBeenCalledTimes(1);
  });
});
