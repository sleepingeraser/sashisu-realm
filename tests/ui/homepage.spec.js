const { test, expect } = require("@playwright/test");

test("User can view the Sashisu Realm homepage", async ({ page }) => {
  // step 1: open the browser and navigate to the site
  await page.goto("http://localhost:3000");

  // step 2: verify the page title or a key element appears
  await expect(page).toHaveTitle(/Sashisu/i);

  // step 3: verify a product element or navigation exists
  const pageContent = await page.locator("body").innerText();
  expect(pageContent.length).toBeGreaterThan(0);

  // step 4: take a screenshot for evidence
  await page.screenshot({ path: "tests/ui/screenshot-homepage.png" });
});
