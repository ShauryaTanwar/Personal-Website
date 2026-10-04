// Regression: saved locations must survive load/save cycles with visible,
// clickable markers and restored cloud openings. No API key required.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
process.chdir(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? require(process.env.PLAYWRIGHT_MODULE)
  : require("playwright");
const server = spawn(
  process.env.PYTHON || (process.platform === "win32" ? "python" : "python3"),
  ["-m", "http.server", "8766", "--directory", ".."],
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
const records = [
  ["Cairo", 30.04, 31.24],
  ["Paris", 48.85, 2.35],
  ["Kyoto", 35.01, 135.76],
  ["Sydney", -33.87, 151.21],
  ["Valencia", 34.42, -118.56],
  ["Lima", -12.04, -77.04],
].map(([name, lat, lon], i) => ({
  id: "test" + i,
  name,
  lat,
  lon,
  country: "Test",
  region: "",
  label: name,
  kind: "city",
  discoveredAt: "2026-10-04T00:00:00Z",
}));
for (const [i, p] of records.entries()) {
  const raw = Buffer.from(JSON.stringify(p));
  p.token =
    i % 2
      ? "." + deflateSync(raw).toString("base64url") + ".time.signature"
      : raw.toString("base64url") + ".time.signature";
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(
        path === "/api/health"
          ? { guide_ready: true }
          : {
              place: records[0],
              overview: { summary: "Fixture overview", highlights: [] },
              weather: null,
            },
      ),
    });
  });
  // Instrument only the test response, without exposing debug state in production.
  const source = await readFile("js/globe.js", "utf8");
  await page.route("**/js/globe.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body:
        source +
        `
const originalSetPlaces = World.prototype.setPlaces;
World.prototype.setPlaces = function(places) {
 originalSetPlaces.call(this,places);
 window.__globe = this;
};`,
    }),
  );
  await page.goto("http://127.0.0.1:8766/Uncharted/");
  for (const damaged of [false, true]) {
    const places = records.map((p) => {
      const copy = { ...p };
      if (damaged) {
        delete copy.lat;
        delete copy.lon;
        delete copy.kind;
      }
      return copy;
    });
    await page.evaluate(
      (places) =>
        localStorage.setItem(
          "uncharted.journey.v1",
          JSON.stringify({
            version: 1,
            places,
            history: [{ role: "user", text: "Remember my journey" }],
            reduced: true,
          }),
        ),
      places,
    );
    for (let round = 0; round < 3; round++) {
      await page.reload();
      await page.locator("#globe-loading").waitFor({ state: "hidden" });
      const result = await page.evaluate(() => {
        const w = window.__globe;
        const state = JSON.parse(localStorage.getItem("uncharted.journey.v1"));
        return {
          count: w.markers.size,
          places: state.places,
          history: state.history,
          mask: state.places.map(
            (p) =>
              w.maskContext.getImageData(
                Math.floor(((p.lon + 180) / 360) * 2048),
                Math.floor(((90 - p.lat) / 180) * 1024),
                1,
                1,
              ).data[0],
          ),
          finite: [...w.markers.values()].every((m) =>
            m.dot.position.toArray().every(Number.isFinite),
          ),
        };
      });
      assert.equal(result.count, 6);
      assert.equal(result.places.length, 6);
      assert(result.finite);
      assert(
        result.mask.every((v) => v > 245),
        "All saved locations must have clear cloud-mask centers",
      );
      result.places.forEach((p, i) => {
        assert.equal(p.lat, records[i].lat);
        assert.equal(p.lon, records[i].lon);
      });
      assert.equal(result.history[0].text, "Remember my journey");
    }
    const target = await page.evaluate(() => {
      const w = window.__globe;
      w.scene.updateMatrixWorld(true);
      w.camera.updateMatrixWorld(true);
      const p = w.markers.get("test0").dot.position.clone().project(w.camera);
      const r = w.element.getBoundingClientRect();
      return {
        x: r.left + ((p.x + 1) * r.width) / 2,
        y: r.top + ((1 - p.y) * r.height) / 2,
      };
    });
    await page.mouse.click(target.x, target.y);
    await page.locator("#place-dialog").waitFor({ state: "visible" });
    assert.equal(await page.locator("#place-name").textContent(), "Cairo");
    await page.locator("#place-dialog [data-close]").click();
  }
  // Reward gate: five discoveries cannot remove clouds, even in a tampered save.
  await page.evaluate(
    (places) =>
      localStorage.setItem(
        "uncharted.journey.v1",
        JSON.stringify({
          version: 1,
          places,
          history: [],
          mode: "explore",
          reduced: true,
          fullEarth: true,
        }),
      ),
    records.slice(0, 5),
  );
  await page.reload();
  await page.locator("#globe-loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator("#full-earth-toggle").isDisabled(), true);
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), true);
  // Importing the sixth unique location unlocks the control without a reload.
  await page.locator("#passport-button").click();
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "journey.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ version: 1, places: [records[5]] })),
    });
  await page.waitForFunction(
    () => document.querySelector("#passport-count").textContent === "6",
  );
  await page.locator("#passport-dialog [data-close]").click();
  assert.equal(await page.locator("#full-earth-toggle").isDisabled(), false);
  // The saved preference activates only after the unlock condition is met.
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), false);
  await page.locator("#full-earth-toggle").click();
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), true);
  await page.locator("#full-earth-toggle").click();
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), false);
  await page.reload();
  await page.locator("#globe-loading").waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), false);
  await page.locator("#clue-mode").click();
  assert.equal(await page.locator("#full-earth-toggle").isDisabled(), true);
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), true);
  await page.reload();
  await page.locator("#globe-loading").waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), true);
  await page.locator("#explore-mode").click();
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), false);
  assert.equal(await page.evaluate(() => window.__globe.markers.size), 6);
  await page.locator("#settings-button").click();
  page.once("dialog", (d) => d.accept());
  await page.locator("#reset-button").click();
  assert.equal(await page.locator("#full-earth-toggle").isDisabled(), true);
  assert.equal(await page.evaluate(() => window.__globe.clouds.visible), true);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: six locations across repeated reloads; preserved coordinates, all cloud openings, finite/clickable globe markers, retained chat, recovery from compressed/uncompressed tokens, and the six-place Free Explore cloud toggle (unlock, mode changes, reload, reset).",
  );
} finally {
  await browser.close();
  server.kill();
}
