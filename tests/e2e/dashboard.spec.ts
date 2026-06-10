import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads dashboard with title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("shows control plane stats cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Total Servers")).toBeVisible();
    await expect(page.getByText("Total Players")).toBeVisible();
    await expect(page.getByText("Active Alerts")).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    
    await page.getByRole("link", { name: /game servers/i }).click();
    await expect(page).toHaveURL(/.*gameservers/);

    await page.getByRole("link", { name: /fleets/i }).click();
    await expect(page).toHaveURL(/.*fleets/);

    await page.getByRole("link", { name: /profiles/i }).click();
    await expect(page).toHaveURL(/.*profiles/);
  });
});
