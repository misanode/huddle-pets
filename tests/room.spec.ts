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

test('the room owner removes a teammate, who loses access and cannot rejoin', async ({ users, request }) => {
  const [owner, guest] = await users(2)
  const roomName = `Kick ${Date.now()}`

  await owner.page.goto('/home')
  await owner.page.getByPlaceholder('Room name').fill(roomName)
  await owner.page.getByRole('button', { name: 'New room' }).click()
  await owner.page.waitForURL(/\/r\/[0-9a-f-]{36}$/)
  const link = owner.page.url()

  await guest.page.goto(link)
  await guest.page.getByRole('button', { name: 'Join room' }).click()
  await expect(guest.page.getByTestId('pet-card')).toHaveCount(2, { timeout: 15_000 })
  await expect(guest.page.getByRole('button', { name: /^Remove / })).toHaveCount(0)

  await guest.page.getByRole('button', { name: 'Connect my agent' }).click()
  const guestKey = (await guest.page.getByRole('dialog').textContent())?.match(/hp_[0-9a-f]{64}/)?.[0] ?? ''
  await guest.page.keyboard.press('Escape')
  const ingest = (key: string) => request.post('/api/ingest', { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, data: '{"event":"Stop"}' })
  expect((await ingest(guestKey)).status()).toBe(204)

  await expect(owner.page.getByTestId('pet-card')).toHaveCount(2, { timeout: 15_000 })
  await expect(owner.page.getByRole('button', { name: /^Remove / })).toHaveCount(1)
  await owner.page.getByRole('button', { name: /^Remove / }).click()
  await owner.page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
  await expect(owner.page.getByTestId('pet-card')).toHaveCount(1, { timeout: 15_000 })

  expect((await ingest(guestKey)).status()).toBe(401)

  await guest.page.goto('/home')
  await expect(guest.page.getByRole('link', { name: roomName })).toHaveCount(0, { timeout: 15_000 })
  await guest.page.goto(link)
  await guest.page.getByRole('button', { name: 'Join room' }).click()
  await expect(guest.page.getByText('You were removed from this room')).toBeVisible({ timeout: 15_000 })
  await expect(guest.page.getByTestId('pet-card')).toHaveCount(0)
})
