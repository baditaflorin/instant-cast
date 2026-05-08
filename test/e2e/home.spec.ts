import { expect, test } from "@playwright/test";

test("loads the studio shell and project links", async ({ page }) => {
  await page.goto("/instant-cast/");
  await expect(page.getByRole("heading", { name: "Instant Cast" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Star on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/instant-cast",
  );
  await expect(page.getByRole("link", { name: "PayPal" })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );
  await expect(page.getByText(/Version .* Commit/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Record" })).toBeVisible();
});
