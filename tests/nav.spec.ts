import { test, expect } from '@playwright/test'

test('Home and the app name go to the landing page, Rooms goes to your rooms', async ({ page }) => {
  const openSettings = async () => {
    await page.goto('/settings')
    await expect(page.getByTestId('app-navigation').getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page', { timeout: 15_000 })
  }
  const nav = page.getByTestId('app-navigation')

  await openSettings()
  await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Rooms' })).toHaveAttribute('href', '/home')
  await nav.getByRole('link', { name: 'Home' }).click()
  await expect(page.getByTestId('static-landing')).toBeVisible()

  await openSettings()
  await nav.getByRole('link', { name: 'huddle-pets' }).click()
  await expect(page.getByTestId('static-landing')).toBeVisible()
})
