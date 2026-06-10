import { test, expect } from "@playwright/test";

test.describe("Control Planes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/control-planes");
  });

  test("loads control planes page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "CONTROL PLANES" })).toBeVisible();
  });

  test("has add control plane button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add control plane/i })).toBeVisible();
  });

  test("form opens and shows required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add control plane/i }).click();

    // Form should be visible with required fields
    await expect(page.getByPlaceholder("Production EU")).toBeVisible();
    await expect(page.getByPlaceholder("http://localhost:8080")).toBeVisible();
    await expect(page.getByRole("button", { name: "ADD CONTROL PLANE" })).toBeVisible();
  });
});

test.describe("API Keys", () => {
  test("loads api keys page", async ({ page }) => {
    await page.goto("/apikeys");
    await expect(page.getByRole("heading", { name: "API KEYS" })).toBeVisible();
  });

  test("has create key button", async ({ page }) => {
    await page.goto("/apikeys");
    await expect(page.getByRole("button", { name: /create key/i })).toBeVisible();
  });
});

test.describe("Audit Logs", () => {
  test("loads audit logs page", async ({ page }) => {
    await page.goto("/audit-logs");
    await expect(page.getByRole("heading", { name: "AUDIT LOGS" })).toBeVisible();
  });

  test("has filter inputs", async ({ page }) => {
    await page.goto("/audit-logs");
    await expect(page.getByPlaceholder(/filter by actor/i)).toBeVisible();
    await expect(page.getByPlaceholder(/filter by action/i)).toBeVisible();
  });
});
