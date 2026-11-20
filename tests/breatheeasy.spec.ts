import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("demo plan and language work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "New Delhi" })).toBeVisible();
  await expect(page.getByText("Hazardous")).toBeVisible();
  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.getByText("डेमो डेटा")).toBeVisible();
  await page.getByRole("button", { name: "मेरे परिवार का दिन बनाएं" }).click();
  await expect(page.getByRole("complementary", { name: "BreatheEasy assistant" })).toBeVisible();
});

test("main page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page } as never).analyze();
  expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
});

test("living skyline slider and what-if keyboard flows", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByRole("slider", { name: "Air quality preview" });
  await slider.focus();
  await slider.press("Home");
  await expect(page.locator(".aqi-number")).toHaveText("20");
  await expect(page.getByText("Good", { exact: true })).toBeVisible();
  await slider.press("ArrowRight");
  await expect(page.locator(".aqi-number")).not.toHaveText("20");

  const purifier = page.getByRole("button", { name: "Purifier in bedroom" });
  await purifier.focus();
  await purifier.press("Enter");
  await expect(purifier).toHaveAttribute("aria-pressed", /false|true/);
  await expect(page.getByText("CO₂ avoided today")).toBeVisible();
});

test("demo and offline states remain usable", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByText("Delhi-style severe smog scenario")).toBeVisible();
  await page.getByRole("checkbox", { name: "Demo mode" }).uncheck();
  await context.setOffline(true);
  await expect(page.getByRole("status")).toContainText("Offline");
  await page.getByRole("button", { name: /Plan my family's day/i }).click();
  await expect(page.getByRole("complementary", { name: "BreatheEasy assistant" })).toBeVisible();
});

test("both themes pass serious axe checks", async ({ page }) => {
  await page.goto("/");
  const dark = await new AxeBuilder({ page } as never).analyze();
  expect(dark.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  await page.getByRole("button", { name: "Switch to Morning theme" }).click();
  const light = await new AxeBuilder({ page } as never).analyze();
  expect(light.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("pledge creates a downloadable share card", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add my family" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("breatheeasy-clean-air-pledge.png");
});
