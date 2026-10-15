import { expect, test } from "@playwright/test";

test("defense calculator groups matchups and updates the URL", async ({ page }) => {
  await page.goto("/");
  const calc = page.getByRole("region", { name: "Type calculator" });
  await expect(calc.getByRole("button", { name: "Fire", exact: true })).toHaveAttribute("aria-pressed", "true");

  await calc.getByRole("button", { name: "Flying", exact: true }).click();
  const results = calc.getByTestId("calc-results");
  await expect(results.locator('[data-multiplier="4"]')).toContainText("Rock");
  await expect(results.locator('[data-multiplier="0"]')).toContainText("Ground");
  await expect(page).toHaveURL(/\/\?t=fire,flying$/);
});

test("garbage query parameters are cleaned up", async ({ page }) => {
  await page.goto("/?t=WATER,banana,water,grass,ice");
  const calc = page.getByRole("region", { name: "Type calculator" });
  const pressed = calc.locator('button[aria-pressed="true"]');
  await expect(pressed).toHaveCount(2);
  await expect(pressed.nth(0)).toHaveText("Water");
  await expect(pressed.nth(1)).toHaveText("Grass");
});

test("attack mode keeps a single type", async ({ page }) => {
  await page.goto("/");
  const calc = page.getByRole("region", { name: "Type calculator" });
  await calc.getByRole("tab", { name: "Attacking" }).click();
  await calc.getByRole("button", { name: "Ground", exact: true }).click();
  await expect(calc.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(calc.getByTestId("calc-results").locator('[data-multiplier="0"]')).toContainText("Flying");
  await expect(page).toHaveURL(/\?m=attack&t=ground$/);
});
