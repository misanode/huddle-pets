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
  await expect.poll(async () => JSON.stringify(await second.getByTestId('pet-card').evaluateAll((els) => els.map((el) => el.getAttribute('data-activity')))), { timeout: 10_000 })
    .toBe(JSON.stringify(await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-activity')))))
  expect(errors).toEqual([])
})
