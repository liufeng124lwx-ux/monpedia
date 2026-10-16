import { expect, test } from "@playwright/test";

test("search finds Pokémon by accent-free name", async ({ page }) => {
  await page.goto("/pokemon");
  await page.getByLabel("Search Pokémon").fill("flabebe");
  await expect(page.getByRole("link", { name: /Flabébé/ })).toBeVisible();
});

test("a Pokémon page shows its weaknesses and links to counters", async ({ page }) => {
  await page.goto("/pokemon/charizard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Charizard Weakness & Counters");
  await expect(page.getByRole("heading", { name: "Best counters to Charizard" })).toBeVisible();
});

test("unknown pages show the 404 with a way back", async ({ page }) => {
  await page.goto("/pokemon/not-a-real-mon");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search all Pokémon" })).toBeVisible();
});

test("header search jumps to the filtered list", async ({ page }) => {
  await page.goto("/natures");
  await page.getByLabel("Jump to a Pokémon").fill("lucario");
  await page.getByLabel("Jump to a Pokémon").press("Enter");
  await expect(page).toHaveURL(/\/pokemon\?q=lucario$/);
  await expect(page.getByLabel("Search Pokémon")).toHaveValue("lucario");
  await expect(page.locator("a[href='/pokemon/lucario-mega']")).toBeVisible();
});

test("type filter survives a reload and Surprise me stays inside it", async ({ page }) => {
  await page.goto("/pokemon?type=ghost");
  await expect(page.getByRole("button", { name: "Ghost", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Surprise me!" }).click();
  await expect(page).toHaveURL(/\/pokemon\/[a-z0-9-]+$/);
  await expect(page.locator("h1 ~ div").first()).toContainText("Ghost");
});

test("previous and next follow Pokédex order", async ({ page }) => {
  await page.goto("/pokemon/bulbasaur");
  await page.locator("a[rel=next]").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ivysaur Weakness & Counters");
  await page.locator("a[rel=prev]").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bulbasaur Weakness & Counters");
});
