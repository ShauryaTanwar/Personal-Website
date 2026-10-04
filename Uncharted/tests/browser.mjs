// Fixture-backed browser tests. These do not claim to test a live OpenAI account.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
process.chdir(fileURLToPath(new URL("..", import.meta.url)));
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? require(process.env.PLAYWRIGHT_MODULE)
  : require("playwright");
const server = spawn(
  process.env.PYTHON || (process.platform === "win32" ? "python" : "python3"),
  ["-m", "http.server", "8765", "--directory", ".."],
  { stdio: "ignore" },
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const place = {
  id: "R1",
  name: "Kyoto",
  country: "Japan",
  region: "Kyoto Prefecture",
  lat: 35.0116,
  lon: 135.7681,
  label: "Kyoto, Japan",
  token: "fixture-token",
};
const messages = [];
let shouldFail = false;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = route.request().postDataJSON();
    let response = {};
    let status = 200;
    if (path === "/api/health") response = { status: "ok", guide_ready: true };
    else if (shouldFail) {
      status = 503;
      response = { error: "Test outage. Please try again." };
    } else if (path === "/api/chat") {
      messages.push(data);
      response =
        data.mode === "clue"
          ? {
              reply: "An ancient imperial capital in Japan. What is it?",
              riddle: "opaque-fixture",
              places: [],
            }
          : { reply: "Kyoto is a beautiful place to begin.", places: [place] };
    } else if (path === "/api/search")
      response = {
        places: [
          place,
          { ...place, id: "R2", name: "Kyoto District", lat: 35.4 },
        ],
      };
    else if (path === "/api/clue")
      response =
        data.action === "hint"
          ? { reply: "Its name begins with K.", solved: false }
          : data.action === "reveal" || data.guess === "Kyoto"
            ? { reply: "You found it!", solved: true, place }
            : { reply: "Not quite.", solved: false };
    else if (path === "/api/place")
      response = {
        place,
        weather: {
          current: {
            temperature_2m: 20,
            apparent_temperature: 19,
            relative_humidity_2m: 60,
            wind_speed_10m: 10,
            weather_code: 2,
            time: "2026-10-04T10:00",
          },
          timezone: "Asia/Tokyo",
        },
        overview: {
          summary: "Kyoto is a historic city in Japan.",
          highlights: [
            "Historic temples",
            "Traditional gardens",
            "Former imperial capital",
          ],
          ai_generated: true,
        },
      };
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(response),
    });
  });
  await page.goto("http://127.0.0.1:8765/Uncharted/");
  await page
    .locator("#globe-loading")
    .waitFor({ state: "hidden", timeout: 30000 });
  await page.locator("#message-input").fill("Take me to Kyoto");
  await page.locator("#chat-form").evaluate((f) => f.requestSubmit());
  await page.locator(".choice").click();
  await page.locator("#place-dialog").waitFor({ state: "visible" });
  await page.waitForFunction(() =>
    document.querySelector("#weather").textContent.includes("20°C"),
  );
  assert.equal(await page.locator("#passport-count").textContent(), "1");
  await page.locator("#unit-button").click();
  assert.match(await page.locator("#weather").textContent(), /68°F/);
  await page.screenshot({
    path: process.env.UI_SCREENSHOT || "/tmp/uncharted-discovery.png",
    fullPage: true,
  });
  await page.locator("#place-dialog [data-close]").click();
  await page.locator("#passport-button").click();
  assert.equal(await page.locator(".passport-entry").count(), 1);
  await page.locator(".passport-entry").click();
  await page.locator("#place-dialog").waitFor({ state: "visible" });
  await page.locator("#place-dialog [data-close]").click();
  await page.reload();
  await page.locator("#globe-loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator("#passport-count").textContent(), "1");
  await page.locator("#clue-mode").click();
  await page
    .getByRole("button", { name: "Start a mystery", exact: true })
    .click();
  await page.locator("#clue-actions").waitFor({ state: "visible" });
  await page.locator("#hint-button").click();
  await page.waitForFunction(() =>
    document.querySelector("#messages").textContent.includes("begins with K"),
  );
  await page.locator("#message-input").fill("Paris");
  await page.locator("#chat-form").evaluate((f) => f.requestSubmit());
  await page.waitForFunction(() =>
    document.querySelector("#messages").textContent.includes("Not quite."),
  );
  await page.locator("#message-input").fill("Kyoto");
  await page.locator("#chat-form").evaluate((f) => f.requestSubmit());
  await page.locator("#place-dialog").waitFor({ state: "visible" });
  assert.equal(
    await page.locator("#passport-count").textContent(),
    "1",
    "Revisiting must not duplicate",
  );
  await page.locator("#place-dialog [data-close]").click();
  await page.locator("#explore-mode").click();
  await page.locator("#message-input").fill("I love mountains");
  await page.locator("#chat-form").evaluate((f) => f.requestSubmit());
  await page.locator(".choice").waitFor();
  assert(messages.at(-1).discoveries.includes("Kyoto, Japan"));
  assert(messages.at(-1).history.length > 0);
  shouldFail = true;
  await page.locator("#message-input").fill("A new destination");
  await page.locator("#chat-form").evaluate((f) => f.requestSubmit());
  await page.waitForFunction(() =>
    document.querySelector("#messages").textContent.includes("Test outage"),
  );
  assert.equal(await page.locator("#message-input").isDisabled(), false);
  shouldFail = false;
  await page.locator("#search-toggle").click();
  await page.locator("#search-input").fill("Kyoto");
  await page.locator("#search-form").evaluate((f) => f.requestSubmit());
  await page.waitForFunction(
    () => document.querySelectorAll(".choice").length === 2,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile horizontal overflow",
  );
  await page.locator("#passport-button").click();
  await page.locator("#passport-filter").fill("nowhere");
  assert.equal(await page.locator(".passport-entry").count(), 0);
  await page.locator("#passport-dialog [data-close]").click();
  // Observatory controls: collapsing the guide must keep navigation usable.
  await page.locator("#guide-toggle").click();
  assert.equal(await page.locator("#companion-panel").isVisible(), false);
  await page.locator("#rail-guide").click();
  assert.equal(await page.locator("#companion-panel").isVisible(), true);
  await page.locator("#map-search-button").click();
  assert.equal(await page.locator("#map-search").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#map-search").isVisible(), false);
  await page.locator("#message-input").fill("Take me somewhere quiet");
  const inputBounds = await page.locator("#message-input").boundingBox();
  assert(
    inputBounds.y >= 0 && inputBounds.y + inputBounds.height <= 844,
    "Mobile composer must stay on screen",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: globe, discovery animation, details, units, passport, persistence, clues, context, duplicate prevention, outage recovery, ambiguity, mobile layout, guide toggle, map search, mobile composer.",
  );
} finally {
  await browser.close();
  server.kill();
}
