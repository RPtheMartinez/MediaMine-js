// @ts-check
import { test, expect } from "@playwright/test";

test.describe("signup flow", () => {
  test("loads signup page", async ({ page }) => {
    await page.goto("/signup.html");

    await expect(page).toHaveTitle(/MediaMine Signup/i);
    await expect(page.getByRole("heading", { name: /MediaMine/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("shows client-side mismatch validation", async ({ page }) => {
    await page.goto("/signup.html");

    await page.getByLabel("First Name *").fill("Taylor");
    await page.getByLabel("Last Name *").fill("Jones");
    await page.getByLabel("Email *").fill("taylor@example.com");
    await page.locator("#password").fill("Password123");
    await page.getByLabel("Confirm Password *").fill("PasswordXYZ");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });

  test("submits form and shows success message", async ({ page }) => {
    await page.route("**/api/signup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          message: "Signup submitted. Check your email to confirm your account.",
          hasSession: false,
          user: null
        })
      });
    });

    await page.goto("/signup.html");

    await page.getByLabel("First Name *").fill("Taylor");
    await page.getByLabel("Last Name *").fill("Jones");
    await page.getByLabel("Email *").fill("taylor@example.com");
    await page.locator("#password").fill("Password123");
    await page.getByLabel("Confirm Password *").fill("Password123");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(
      page.getByText("Signup submitted. Check your email to confirm your account.")
    ).toBeVisible();
  });
});
