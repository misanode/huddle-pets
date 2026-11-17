import { test, expect, loadAllTestAccounts } from 'deepspace/testing'

test.skip(loadAllTestAccounts().length < 2, 'Needs 2 test accounts: npx deepspace test accounts create')

test('a teammate joins by link and both see the same pet update live', async ({ users }) => {
  const [a, b] = await users(2)
  const roomName = `Room ${Date.now()}`

  await a.page.goto('/home')
  await a.page.getByPlaceholder('Room name').fill(roomName)
  await a.page.getByRole('button', { name: 'New room' }).click()
  await a.page.waitForURL(/\/r\/[0-9a-f-]{36}$/)
  const link = a.page.url()

  await b.page.goto('/home')
  await expect(b.page.getByText('No rooms yet')).toBeVisible({ timeout: 15_000 })
  await expect(b.page.getByRole('link', { name: roomName })).toHaveCount(0)

  await b.page.goto(link)
  await expect(b.page.getByTestId('pet-card')).toHaveCount(0)
  await b.page.getByRole('button', { name: 'Join room' }).click()

  for (const { page } of [a, b]) {
    await expect(page.getByRole('heading', { name: roomName })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('pet-card')).toHaveCount(2, { timeout: 15_000 })
  }

  const aOwnCard = a.page.getByTestId('pet-card').filter({ hasText: '(you)' })
  const aCardOnB = b.page.getByTestId('pet-card').filter({ hasNotText: '(you)' })
  await a.page.getByRole('button', { name: 'Simulate activity' }).click()
  await expect(aOwnCard).not.toHaveAttribute('data-activity', 'idle')
  const activity = await aOwnCard.getAttribute('data-activity')
  await expect(aCardOnB).toHaveAttribute('data-activity', activity ?? '')

  await b.page.reload()
  await expect(aCardOnB).toHaveAttribute('data-activity', activity ?? '', { timeout: 15_000 })
})
