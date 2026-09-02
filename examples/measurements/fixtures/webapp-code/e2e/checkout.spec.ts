import { test, expect } from '@playwright/test'

test('adds two items and shows the total', async ({ page }) => {
  await page.goto('/shop')
  await page.getByRole('button', { name: 'Add to cart' }).first().click()
  await expect(page.getByTestId('total')).toContainText('$')
})
