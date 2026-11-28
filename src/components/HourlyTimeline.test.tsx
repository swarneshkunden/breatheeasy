import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HourlyTimeline } from "./HourlyTimeline";
import type { HourlyAir } from "@/lib/types";

describe("HourlyTimeline", () => {
  it("skips null AQI values and labels the current forecast hour", () => {
    const currentTime = new Date(Date.now() + 60 * 60 * 1000);
    currentTime.setMinutes(0, 0, 0);
    const utcOffsetSeconds = -currentTime.getTimezoneOffset() * 60;
    const previousTime = new Date(currentTime.getTime() - 60 * 60 * 1000);
    const hourly: HourlyAir[] = [
      {
        time: previousTime.toISOString(),
        aqi: null,
        pm25: null,
        pm10: null,
        no2: null,
        o3: null,
      },
      {
        time: currentTime.toISOString(),
        aqi: 42,
        pm25: 12,
        pm10: 22,
        no2: 9,
        o3: 18,
      },
    ];
    render(
      <HourlyTimeline
        hourly={hourly}
        currentHour={currentTime.getHours()}
        utcOffsetSeconds={utcOffsetSeconds}
        language="en"
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("Now")).toBeTruthy();
  });

  it("shows unavailable text when no measured hourly values exist", () => {
    render(
      <HourlyTimeline
        hourly={[]}
        currentHour={11}
        utcOffsetSeconds={0}
        language="en"
      />,
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Hourly air data unavailable",
    );
  });
});
