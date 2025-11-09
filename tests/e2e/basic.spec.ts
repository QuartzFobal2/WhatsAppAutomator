import { test, expect } from '@playwright/test';
test('basic e2e placeholder', async ({ page }) => {
  await page.goto('about:blank');
  expect(await page.title()).toBe('');
});
