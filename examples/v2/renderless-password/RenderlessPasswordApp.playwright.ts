import { test, expect } from "@playwright/experimental-ct-vue";
import RenderlessPasswordApp from "./RenderlessPasswordApp.vue";

test.use({ viewport: { width: 500, height: 500 } });

test("renders and validates", async ({ mount, page }) => {
  await mount(RenderlessPasswordApp);
  await page.waitForSelector("#password-complexity.low");
  await page.fill("#password", "password");
  await page.waitForSelector("#password-complexity.mid");
  await page.fill("#password", "password123");
  await page.waitForSelector("#password-complexity.high");

  let submitButton = page.locator(
    'button:has-text("Submit"):disabled'
  );
  expect(await submitButton.isDisabled()).toBe(true);

  await page.fill("#confirmation", "password123");

  submitButton = page.locator('button:has-text("Submit")');
  expect(await submitButton.isDisabled()).toBe(false);
});
