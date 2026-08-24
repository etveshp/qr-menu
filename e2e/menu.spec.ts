import { test, expect } from '@playwright/test';

// Happy path: QR menu opens -> categories visible -> product modal opens ->
// product added to cart -> cart persists after reload.
test('menu happy path: browse, add to cart, persist', async ({ page }) => {
  await page.goto('/?table=3');

  // Categories grid is rendered
  await expect(page.getByRole('heading', { name: 'Категорії' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Еспресо бар/ }).first()).toBeVisible();

  // Open the Espresso Bar category
  await page.getByRole('button', { name: /Еспресо бар/ }).first().click();

  // Product card appears
  const espressoCard = page.locator('h4', { hasText: 'Подвійне еспресо' }).locator('xpath=ancestor::div[contains(@class,"flex-col")]').first();
  await expect(espressoCard).toBeVisible();

  // Open product modal by clicking the card
  await espressoCard.click();

  // Modal shows product details
  await expect(page.getByRole('heading', { name: 'Подвійне еспресо' }).last()).toBeVisible();
  await expect(page.getByText('Інгредієнти')).toBeVisible();

  // Increase quantity to 2 then add to cart
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.locator('button').filter({ hasText: 'Додати' }).last().click();

  // Cart badge shows 2 after closing modal (badge persists across reload)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Reload and verify cart persisted via localStorage
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  const storedCart = await page.evaluate(() => localStorage.getItem('aura_cart'));
  expect(JSON.parse(storedCart || '{}')).toEqual({ espresso: 2 });
});
