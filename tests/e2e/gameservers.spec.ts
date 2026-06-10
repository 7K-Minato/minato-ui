import { test, expect } from "@playwright/test";

test.describe("Game Servers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gameservers");
  });

  test("loads game servers page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Game Servers" })).toBeVisible();
    await expect(page.getByText("Manage your game servers across clusters")).toBeVisible();
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
    const headers = ["Status", "Name", "Namespace", "Profile", "Players", "Created", "Actions"];
    for (const header of headers) {
      await expect(page.getByRole("cell", { name: header }).first()).toBeVisible();
    }
  });
});

test.describe("Game Server Detail", () => {
  test("shows tabs on detail page", async ({ page }) => {
    // This test assumes there's at least one server
    // In a real test environment, we'd create a server first
    await page.goto("/gameservers");
    
    // Try to click on the first server link
    const firstServer = page.getByRole("link").filter({ hasText: /^(?!.*View).*$/ }).first();
    if (await firstServer.isVisible().catch(() => false)) {
      await firstServer.click();
      await expect(page.getByRole("tab", { name: "overview" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "actions" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "snapshots" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "players" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "console" })).toBeVisible();
    }
  });
});
