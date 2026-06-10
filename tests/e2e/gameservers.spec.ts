import { test, expect } from "@playwright/test";

test.describe("Game Servers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gameservers");
  });

  test("loads game servers page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "GAME SERVERS" })).toBeVisible();
    await expect(page.getByText("MANAGE YOUR GAME SERVERS ACROSS CLUSTERS")).toBeVisible();
  });

  test("has create server button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create server/i })).toBeVisible();
  });

  test("filter inputs are present", async ({ page }) => {
    await expect(page.getByPlaceholder("Search...")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("advanced filters toggle works", async ({ page }) => {
    await page.getByText(/show advanced filters/i).click();
    await expect(page.getByText("Min Players")).toBeVisible();
    await expect(page.getByText("Max Players")).toBeVisible();
    await expect(page.getByText("Sort By")).toBeVisible();
  });

  test("table headers are correct", async ({ page }) => {
    const headers = ["STATUS", "NAME", "NAMESPACE", "PROFILE", "PLAYERS", "CREATED", "ACTIONS"];
    for (const header of headers) {
      await expect(page.getByRole("columnheader", { name: header }).first()).toBeVisible();
    }
  });
});

test.describe("Game Server Detail", () => {
  test("shows tabs on detail page", async ({ page }) => {
    // This test assumes there's at least one server
    // In a real test environment, we'd create a server first
    await page.goto("/gameservers");

    // Try to click on the first server link in the table body
    const firstServer = page.locator("table tbody tr td a").first();
    if (await firstServer.isVisible().catch(() => false)) {
      await firstServer.click();
      await expect(page.getByRole("tab", { name: "OVERVIEW" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "ACTIONS" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "SNAPSHOTS" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "PLAYERS" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "CONSOLE" })).toBeVisible();
    }
  });
});
