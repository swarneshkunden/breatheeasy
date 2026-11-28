import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];
const themes = ["light", "dark"] as const;
const languages = ["en", "hi"] as const;
const pages = [
  { path: "/", name: "landing" },
  { path: "/app", name: "app" },
] as const;

test("location action has visible, accessible text", async ({ page }) => {
  await page.goto("/app");
  const locationButton = page.getByRole("button", { name: "Use my location" });
  await expect(locationButton).toBeVisible();
  await expect(locationButton).toHaveAttribute("title", "Use my location");
  await expect(locationButton).not.toHaveAttribute("aria-label", /.*/);
  await expect(locationButton).toContainText("Use my location");
  await expect(page.getByText(/No location selected/)).toBeVisible();
});

test("demo mode is labeled and household profile saves", async ({ page }) => {
  await page.goto("/app");
  const demoSwitch = page.getByRole("switch", { name: "Demo data" });
  await demoSwitch.check();
  await expect(page.getByRole("heading", { name: "New Delhi" })).toBeVisible();
  await expect(page.getByText(/Showing demo data/)).toBeVisible();

  await page.getByRole("button", { name: "Edit household" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Edit household" }),
  ).toBeVisible();
});

test("chat sends suggested questions and shows the returned answer", async ({
  page,
}) => {
  const messages: string[] = [];
  await page.route("**/api/ai", async (route) => {
    const body = route.request().postDataJSON() as { message: string };
    messages.push(body.message);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Use filtered indoor air while readings are unavailable.",
        tips: ["When can I open the windows?"],
        followUps: [],
        lowEmission: [],
        indoor: [],
        sustainable: [],
        smartMode: "offline",
        smartModeReason: "missing_api_key",
      }),
    });
  });
  await page.goto("/app");
  await page.getByRole("button", { name: "Plan my family's day" }).click();
  const chat = page.getByRole("complementary", {
    name: "BreatheEasy assistant",
  });
  await expect(chat).toBeVisible();
  await expect(
    chat.getByText("Use filtered indoor air while readings are unavailable."),
  ).toBeVisible();
  await chat
    .getByRole("button", { name: "When can I open the windows?" })
    .click();
  await expect.poll(() => messages).toHaveLength(2);
  expect(messages[1]).toBe("When can I open the windows?");
});

test("city selection closes suggestions and requests localized results", async ({
  page,
}) => {
  let geocodeUrl = "";
  await page.route("**/api/geocode**", async (route) => {
    geocodeUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            name: "Pune",
            admin1: "Maharashtra",
            country: "India",
            latitude: 18.52,
            longitude: 73.86,
          },
        ],
      }),
    });
  });
  await page.route("**/api/air**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        aqi: 72,
        pm25: 18,
        pm10: 24,
        no2: 8,
        o3: 30,
        city: "Pune",
        latitude: 18.52,
        longitude: 73.86,
        hourly: [],
        source: "live",
        updatedAt: "2026-01-01T00:00:00.000Z",
        timezone: "Asia/Kolkata",
        utcOffsetSeconds: 19800,
      }),
    });
  });

  await page.goto("/app");
  await page.getByRole("button", { name: "हि" }).click();
  const search = page.getByRole("combobox");
  await search.fill("Pune");
  const city = page.getByRole("option", { name: "Pune, Maharashtra, India" });
  await expect(city).toBeVisible();
  await expect.poll(() => geocodeUrl).toContain("lang=hi");
  await city.click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Pune, Maharashtra, India" }),
  ).toBeVisible();
});

for (const pageSpec of pages) {
  for (const viewport of viewports) {
    for (const theme of themes) {
      for (const language of languages) {
        test(`${pageSpec.name} screenshot and axe ${viewport.width}px ${theme} ${language}`, async ({
          page,
        }) => {
          await page.setViewportSize(viewport);
          await page.goto(pageSpec.path);
          if (language === "hi") {
            await page.locator('button[lang="hi"]').click();
          }
          await page
            .locator(".theme-control button")
            .nth(theme === "dark" ? 1 : 0)
            .click();

          if (pageSpec.path === "/app") {
            await expect(
              page.getByRole("button", {
                name:
                  language === "en"
                    ? "Use my location"
                    : "मेरी लोकेशन इस्तेमाल करें",
              }),
            ).toBeVisible();
          } else {
            await expect(page.locator("main")).toBeVisible();
          }
          await page.evaluate(() => document.fonts.ready);
          const violations = await new AxeBuilder({ page }).analyze();
          expect(violations.violations).toEqual([]);
          await expect(page).toHaveScreenshot(
            `${pageSpec.name}-${viewport.width}-${theme}-${language}.png`,
            { animations: "disabled", caret: "hide" },
          );
        });
      }
    }
  }
}
