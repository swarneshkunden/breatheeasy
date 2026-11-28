import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Sun } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import { categorizeAqi } from "@/lib/rules/engine";
import { AirDisplay } from "./AirDisplay";

vi.mock("@/components/LivingSkyline", () => ({
  LivingSkyline: () => <div aria-hidden="true" />,
}));

vi.mock("@/components/CitySearch", () => ({
  CitySearch: () => <div aria-hidden="true" />,
}));

describe("AirDisplay location control", () => {
  it("shows a visible label on the location button", () => {
    render(
      <AirDisplay
        demo={false}
        current={{
          aqi: null,
          pm25: null,
          pm10: null,
          no2: null,
          o3: null,
          city: "",
          latitude: 0,
          longitude: 0,
          hourly: [],
          source: "unavailable",
          updatedAt: "",
          timezone: null,
          utcOffsetSeconds: null,
        }}
        previewAqi={null}
        previewCategory={categorizeAqi(null)}
        CategoryIcon={Sun}
        t={copy.en}
        language="en"
        loading={false}
        locating={false}
        onPlanDay={vi.fn()}
        onLocate={vi.fn()}
        onToggleFollow={vi.fn()}
        following={false}
        locationError={null}
        onCitySelect={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Use my location" });
    expect(button.querySelector("span")?.textContent).toBe("Use my location");
    expect(button.getAttribute("aria-label")).toBeNull();
    expect(button.getAttribute("title")).toBe("Use my location");
  });
});
