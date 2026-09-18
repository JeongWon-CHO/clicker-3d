import { test, expect } from "@playwright/test";

test("each rapid valid click starts a separate decoded sound; drag stays silent", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const started: AudioBufferSourceNode[] = [];
    (window as any).clickSounds = started;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      started.push(this);
      return start.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(page.locator(".stage")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
  const box = (await page.locator("canvas").boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  for (let i = 0; i < 20; i++) await page.mouse.click(x, y);
  await expect(page.getByTestId("count")).toHaveText("20");
  await expect
    .poll(() => page.evaluate(() => (window as any).clickSounds.length))
    .toBe(20);
  expect(
    await page.evaluate(() => {
      const sources = (window as any).clickSounds as AudioBufferSourceNode[];
      return (
        new Set(sources).size === 20 &&
        sources.every(
          (source) =>
            source.context.state === "running" &&
            source.buffer &&
            source.buffer.duration > 0 &&
            source.buffer
              .getChannelData(0)
              .some((sample) => Math.abs(sample) > 0.001),
        )
      );
    }),
  ).toBe(true);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 100, y + 70, { steps: 10 });
  await page.mouse.up();
  await page.mouse.click(20, y);
  expect(await page.evaluate(() => (window as any).clickSounds.length)).toBe(
    20,
  );
  await expect(page.getByTestId("count")).toHaveText("20");
});

test("simultaneous touches each start their own sound", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const started: AudioBufferSourceNode[] = [];
    (window as any).clickSounds = started;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      started.push(this);
      return start.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(page.locator(".stage")).toHaveAttribute("data-ready", "true");
  const box = (await page.locator("canvas").boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: x - 8, y, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: x - 8, y, id: 1 },
      { x: x + 8, y, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("count")).toHaveText("2");
  await expect
    .poll(() => page.evaluate(() => (window as any).clickSounds.length))
    .toBe(2);
  await context.close();
});
