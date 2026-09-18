import { test, expect } from "@playwright/test";

test("custom mode dropdown keyboard and dismissal", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("combobox", { name: "표정 모드" });
  await trigger.focus();
  await trigger.press("ArrowDown");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("option", { name: /직접 선택 - 기본/ }),
  ).toHaveAttribute("aria-disabled", "false");
  await trigger.press("ArrowDown");
  await trigger.press("Enter");
  await expect(trigger).toHaveText("직접 선택 - 기본");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.screenshot({ path: "test-results/mode-dropdown.png" });
  await trigger.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.mouse.click(20, 20);
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("Auto thresholds, collapsed mode picker, manual selection and reset persistence", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("clicker:count:v1") === null)
      localStorage.setItem("clicker:count:v1", "99");
  });
  await page.goto("/");
  await expect(page.locator(".stage")).toHaveAttribute("data-ready", "true");
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  const controls = page.locator(".expression-controls");
  const click = async () => {
    const box = (await page.locator("canvas").boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  await expect(button("직접 선택")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "얼굴 표정" })).toHaveCount(0);
  await expect(controls).toHaveAttribute("data-face", "default");
  await click();
  await expect(controls).toHaveAttribute("data-face", "angry");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("clicker:count:v1")))
    .toBe("100");
  await page.evaluate(() => localStorage.setItem("clicker:count:v1", "399"));
  await page.reload();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-press-depth",
    "0.000",
  );
  await expect(page.getByTestId("count")).toHaveText("399");
  await expect(controls).toHaveAttribute("data-face", "angry");
  await click();
  await expect(controls).toHaveAttribute("data-face", "crying");
  await page.getByRole("combobox", { name: "표정 모드" }).click();
  await page.getByRole("option", { name: /직접 선택 - 화남/ }).click();
  await click();
  await expect(controls).toHaveAttribute("data-face", "angry");
  await page
    .locator(".count-panel")
    .getByRole("button", { name: "클릭 수 초기화" })
    .click();
  await expect(page.getByTestId("count")).toHaveText("0");
  await expect(controls).toHaveAttribute("data-face", "angry");
  await page.getByRole("combobox", { name: "표정 모드" }).click();
  await page.getByRole("option", { name: /Auto/ }).click();
  await expect(controls).toHaveAttribute("data-face", "default");
  await expect(page.getByRole("group", { name: "얼굴 표정" })).toHaveCount(0);
  await click();
  await button("클릭 수 초기화").click();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  expect(
    await page.evaluate(() => localStorage.getItem("clicker:count:v1")),
  ).toBe("0");
  await page.reload();
  await expect(page.getByTestId("count")).toHaveText("0");
  await expect(page.getByRole("combobox", { name: "표정 모드" })).toHaveText(
    "Auto",
  );
});
