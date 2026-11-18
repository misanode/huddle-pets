import { test, expect } from '@playwright/test'

test('Home and the app name go to the landing page, Rooms goes to your rooms', async ({ page }) => {
  await page.goto('/demo')
  const nav = page.getByTestId('app-navigation')
  await expect(nav.getByRole('link', { name: 'Demo' })).toHaveAttribute('aria-current', 'page', { timeout: 15_000 })
  await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Rooms' })).toHaveAttribute('href', '/home')

  await nav.getByRole('link', { name: 'Home' }).click()
  await expect(page.getByTestId('static-landing')).toBeVisible()

  await page.goto('/demo')
  await page.getByTestId('app-navigation').getByRole('link', { name: 'huddle-pets' }).click()
  await expect(page.getByTestId('static-landing')).toBeVisible()
})
