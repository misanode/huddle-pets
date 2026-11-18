import { test, expect } from '@playwright/test'
import { captureConsoleErrors } from './helpers/errors'

test('signed-out visitors watch the demo pets change live', async ({ page, browser }) => {
  const errors = captureConsoleErrors(page)
  await page.goto('/demo')
  const cards = page.getByTestId('pet-card')
  await expect(cards).toHaveCount(4, { timeout: 15_000 })

  const before = await cards.evaluateAll((els) => els.map((el) => `${el.textContent}`))
  await expect.poll(() => cards.evaluateAll((els) => els.map((el) => `${el.textContent}`)), { timeout: 20_000 }).not.toEqual(before)

  const second = await browser.newPage()
  await second.goto('/demo')
  await expect(second.getByTestId('pet-card')).toHaveCount(4, { timeout: 15_000 })
  const activities = (p: typeof page) => p.getByTestId('pet-card').evaluateAll((els) => els.map((el) => el.getAttribute('data-activity')).join())
  await expect.poll(async () => new Set(await Promise.all([activities(page), activities(second)])).size, { timeout: 15_000 }).toBe(1)

  await expect
    .poll(() => cards.evaluateAll((els) => els.every((el) => el.querySelector('model-viewer')?.getAttribute('data-clip') === (el.getAttribute('data-activity') === 'editing' ? 'typing' : el.getAttribute('data-activity')))), { timeout: 20_000 })
    .toBe(true)
  expect(errors).toEqual([])
})
