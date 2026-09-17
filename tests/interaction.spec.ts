import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".stage")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
  // Texture loading labels and fonts may resize the stage before ResizeObserver catches up.
  await expect
    .poll(async () => {
      const box = (await page.locator("canvas").boundingBox())!;
      const stage = (await page.locator(".stage").boundingBox())!;
      return Math.abs(box.height - stage.height);
    })
    .toBeLessThanOrEqual(1);
  const box = (await page.locator("canvas").boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test("GLB loads; pointerdown presses, pointerup counts; drag cancels and rotates; count persists", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const center = await ready(page);
  const canvas = page.locator("canvas");
  const count = page.getByTestId("count");
  await page.screenshot({ path: "test-results/desktop-initial.png" });
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-press-depth")))
    .toBeGreaterThan(0.8);
  await expect(count).toHaveText("0");
  await page.screenshot({ path: "test-results/desktop-pressed.png" });
  await page.mouse.up();
  await expect(count).toHaveText("1");
  await expect(canvas).toHaveAttribute("data-press-depth", "0.000");

  const before = await canvas.screenshot();
  await page.mouse.down();
  await page.mouse.move(center.x + 180, center.y + 90, { steps: 15 });
  await expect(canvas).toHaveAttribute("data-press-depth", "0.000");
  await page.mouse.up();
  await expect(count).toHaveText("1");
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  await page.screenshot({ path: "test-results/desktop-rotated.png" });

  // Returning a drag to its start must not turn it back into a click.
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 60, center.y, { steps: 5 });
  await page.mouse.move(center.x, center.y, { steps: 5 });
  await page.mouse.up();
  await expect(count).toHaveText("1");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("clicker:count:v1")))
    .toBe("1");
  await page.reload();
  await expect(count).toHaveText("1");
  expect(errors).toEqual([]);
});

test("face variants swap without requests or remounting and preserve clicking", async ({
  page,
}) => {
  const center = await ready(page);
  await page.getByRole("combobox", { name: "표정 모드" }).click();
  await page.getByRole("option", { name: /직접 선택/ }).click();
  const normal = page.getByRole("button", { name: "기본 종근이", exact: true });
  const crying = page.getByRole("button", {
    name: "울고 있는 종근이",
    exact: true,
  });
  await expect(normal).toBeEnabled();
  await expect(crying).toBeEnabled();
  const canvas = page.locator("canvas");
  const original = await canvas.screenshot();
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  // Already uploaded textures must work even with subsequent network access blocked.
  await page.context().setOffline(true);
  await crying.click();
  await expect(crying).toHaveAttribute("aria-pressed", "true");
  const changed = await canvas.screenshot();
  expect(changed.equals(original)).toBe(false);
  await expect(page.getByTestId("count")).toHaveText("0");
  await page.screenshot({ path: "test-results/crying-face.png" });
  await normal.click();
  expect((await canvas.screenshot()).equals(original)).toBe(true);
  await crying.click();
  await page.mouse.click(center.x, center.y);
  await expect(page.getByTestId("count")).toHaveText("1");
  await expect(canvas).toHaveAttribute("data-press-depth", "0.000");
  expect(requests.filter((url) => /\.(png|jpg|glb)(\?|$)/.test(url))).toEqual(
    [],
  );
});

test("rapid clicks are counted exactly and writes are throttled; pagehide flushes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    (window as any).writes = 0;
    Storage.prototype.setItem = function (key, value) {
      (window as any).writes++;
      return original.call(this, key, value);
    };
  });
  const center = await ready(page);
  for (let i = 0; i < 15; i++) await page.mouse.click(center.x, center.y);
  await expect(page.getByTestId("count")).toHaveText("15");
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  expect(
    await page.evaluate(() => localStorage.getItem("clicker:count:v1")),
  ).toBe("15");
  expect(await page.evaluate(() => (window as any).writes)).toBeLessThan(15);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
});

test("background and cancelled gestures do not count", async ({ page }) => {
  const center = await ready(page);
  await page.mouse.click(30, center.y);
  await expect(page.getByTestId("count")).toHaveText("0");
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await expect(page.getByTestId("count")).toHaveText("0");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
});

test("invalid stored count and unavailable storage are handled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("clicker:count:v1", "-123");
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "QuotaExceededError");
    };
  });
  const center = await ready(page);
  await expect(page.getByTestId("count")).toHaveText("0");
  await page.mouse.click(center.x, center.y);
  await expect(page.getByTestId("count")).toHaveText("1");
  await expect(page.locator(".save-note")).toContainText("저장할 수 없어요");
});

test("mobile viewport supports tapping without horizontal overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173");
  await expect(page.locator(".stage")).toHaveAttribute("data-ready", "true");
  const box = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId("count")).toHaveText("1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png" });
  const cdp = await context.newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  await expect
    .poll(async () =>
      Number(await page.locator("canvas").getAttribute("data-press-depth")),
    )
    .toBeGreaterThan(0.8);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 70, y: y + 30, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("count")).toHaveText("1");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
  // Adding a second finger cancels a pending click, even without a drag.
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x, y, id: 1 },
      { x: x + 20, y, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("count")).toHaveText("1");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
  await context.close();
});
