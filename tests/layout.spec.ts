import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 740 },
]) {
  test(`mobile canvas stays the same size across modes at ${viewport.width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173");
    await expect(page.locator(".stage")).toHaveAttribute("data-ready", "true");
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-press-depth", "0.000");
    const before = (await canvas.boundingBox())!;
    const mode = page.getByRole("combobox", { name: "표정 모드" });
    await mode.tap();
    await page.getByRole("option", { name: /직접 선택 - 기본/ }).tap();
    await expect(page.getByRole("group", { name: "얼굴 표정" })).toHaveCount(0);
    const manual = (await canvas.boundingBox())!;
    expect(manual.width).toBeCloseTo(before.width, 1);
    expect(manual.height).toBeCloseTo(before.height, 1);
    await mode.tap();
    await page.getByRole("option", { name: /Auto/ }).tap();
    const after = (await canvas.boundingBox())!;
    expect(after.width).toBeCloseTo(before.width, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await context.close();
  });
}
