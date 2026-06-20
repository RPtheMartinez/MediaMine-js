// @ts-check
import { test, expect } from "@playwright/test";

test.describe("manual newsapi key blur validation", () => {
  test("shows validation feedback after api key field blur", async ({ page }) => {
    await page.goto("/");

    const apiKeyInput = page.getByLabel("NewsAPI Key");
    await apiKeyInput.fill("invalid-key");
    await apiKeyInput.blur();

    await expect(
      page.getByText("NewsAPI key looks invalid. It should be 32 hexadecimal characters.")
    ).toBeVisible();

    await expect(apiKeyInput).toHaveClass(/input-error/);
    await expect(page.getByRole("button", { name: "Get News Headlines" })).toBeDisabled();
  });
});
