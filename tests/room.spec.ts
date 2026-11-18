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
  await expect(guest.page.getByRole('heading', { name: 'You were removed from this room' })).toBeVisible({ timeout: 15_000 })
  await expect(guest.page.getByRole('button', { name: 'Join room' })).toHaveCount(0)
  await expect(guest.page.getByTestId('pet-card')).toHaveCount(0)
})

test('the room owner deletes a room, and its link stops working for everyone', async ({ users, request }) => {
  const [owner, guest] = await users(2)
  const roomName = `Delete ${Date.now()}`

  await owner.page.goto('/home')
  await owner.page.getByPlaceholder('Room name').fill(roomName)
  await owner.page.getByRole('button', { name: 'New room' }).click()
  await owner.page.waitForURL(/\/r\/[0-9a-f-]{36}$/)
  const link = owner.page.url()

  await guest.page.goto(link)
  await guest.page.getByRole('button', { name: 'Join room' }).click()
  await expect(guest.page.getByTestId('pet-card')).toHaveCount(2, { timeout: 15_000 })
  await guest.page.getByRole('button', { name: 'Connect my agent' }).click()
  const guestKey = (await guest.page.getByRole('dialog').textContent())?.match(/hp_[0-9a-f]{64}/)?.[0] ?? ''
  await guest.page.keyboard.press('Escape')

  await guest.page.goto('/home')
  await expect(guest.page.getByRole('link', { name: roomName })).toBeVisible({ timeout: 15_000 })
  await expect(guest.page.getByRole('button', { name: `Delete ${roomName}` })).toHaveCount(0)

  await owner.page.goto('/home')
  await owner.page.getByRole('button', { name: `Delete ${roomName}` }).click()
  await owner.page.getByRole('dialog').getByRole('button', { name: 'Delete room' }).click()
  await expect(owner.page.getByRole('link', { name: roomName })).toHaveCount(0, { timeout: 15_000 })

  const ingest = await request.post('/api/ingest', { headers: { Authorization: `Bearer ${guestKey}`, 'Content-Type': 'application/json' }, data: '{"event":"Stop"}' })
  expect(ingest.status()).toBe(401)

  await guest.page.reload()
  await expect(guest.page.getByRole('link', { name: roomName })).toHaveCount(0, { timeout: 15_000 })
  for (const { page } of [owner, guest]) {
    await page.goto(link)
    await expect(page.getByRole('heading', { name: 'This room no longer exists' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Join room' })).toHaveCount(0)
  }
})

test('renaming yourself updates your pet in every room, live for teammates', async ({ users }) => {
  const [a, b] = await users(2)
  const link = async (name: string) => {
    await a.page.goto('/home')
    await a.page.getByPlaceholder('Room name').fill(name)
    await a.page.getByRole('button', { name: 'New room' }).click()
    await a.page.waitForURL(/\/r\/[0-9a-f-]{36}$/)
    return a.page.url()
  }
  const first = await link(`Rename A ${Date.now()}`)
  const second = await link(`Rename B ${Date.now()}`)

  await b.page.goto(first)
  await b.page.getByRole('button', { name: 'Join room' }).click()
  await expect(b.page.getByTestId('pet-card')).toHaveCount(2, { timeout: 15_000 })

  const newName = `Pixel ${Date.now() % 100000}`
  await a.page.goto(first)
  await a.page.getByRole('button', { name: 'Edit your name and city' }).click()
  await a.page.getByLabel('Display name').fill(newName)
  await a.page.getByLabel('City (optional)').fill('Austin')
  await a.page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()

  await expect(a.page.getByTestId('pet-card').filter({ hasText: '(you)' })).toContainText(newName, { timeout: 15_000 })
  const aOnB = b.page.getByTestId('pet-card').filter({ hasNotText: '(you)' })
  await expect(aOnB).toContainText(newName, { timeout: 15_000 })
  await expect(aOnB.getByTestId('pet-clock')).toHaveText(/(AM|PM) \S+$/)
  await expect(aOnB.getByTestId('pet-city')).toHaveText('Austin')
  await a.page.goto(second)
  await expect(a.page.getByTestId('pet-card').filter({ hasText: '(you)' })).toContainText(newName, { timeout: 15_000 })

  await a.page.goto('/settings')
  await expect(a.page.getByLabel('Display name')).toHaveValue(newName, { timeout: 15_000 })
  await expect(b.page.getByRole('button', { name: 'Edit your name and city' })).toHaveCount(1)
  await expect(b.page.getByRole('button', { name: /^Remove / })).toHaveCount(0)
})

test('searching your rooms filters by name and never shows rooms you are not in', async ({ users }) => {
  const [a, b] = await users(2)
  const stamp = Date.now()
  const create = async (name: string) => {
    await a.page.goto('/home')
    await a.page.getByPlaceholder('Room name').fill(name)
    await a.page.getByRole('button', { name: 'New room' }).click()
    await a.page.waitForURL(/\/r\/[0-9a-f-]{36}$/)
  }
  await create(`Café Crew ${stamp}`)
  await create(`Design Desk ${stamp}`)

  await a.page.goto('/home')
  const search = a.page.getByRole('searchbox', { name: 'Search your rooms' })
  await search.fill(`cafe crew ${stamp}`)
  await expect(a.page.getByRole('link', { name: `Café Crew ${stamp}` })).toBeVisible({ timeout: 15_000 })
  await expect(a.page.getByRole('link', { name: `Design Desk ${stamp}` })).toHaveCount(0)
  await search.fill(`nothing ${stamp}`)
  await expect(a.page.getByText(`No rooms match “nothing ${stamp}”.`)).toBeVisible()
  await a.page.getByRole('button', { name: 'Clear search' }).click()
  await expect(a.page.getByRole('link', { name: `Design Desk ${stamp}` })).toBeVisible()

  await b.page.goto('/home')
  await expect(b.page.getByRole('link', { name: `Café Crew ${stamp}` })).toHaveCount(0, { timeout: 15_000 })
  const bSearch = b.page.getByRole('searchbox', { name: 'Search your rooms' })
  if (await bSearch.count()) {
    await bSearch.fill(`${stamp}`)
    await expect(b.page.getByRole('link', { name: new RegExp(`${stamp}`) })).toHaveCount(0)
  }
})
