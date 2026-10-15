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
