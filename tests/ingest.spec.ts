import { test, expect } from '@playwright/test'
import { test as signedIn, expect as signedInExpect, loadAllTestAccounts } from 'deepspace/testing'

const unknownKey = `hp_${'0'.repeat(64)}`
const post = (request: import('@playwright/test').APIRequestContext, key: string | undefined, data: string) =>
  request.post('/api/ingest', { headers: { ...(key && { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json' }, data })

test.describe('ingest rejects bad requests', () => {
  test('missing key', async ({ request }) => {
    expect((await post(request, undefined, '{"event":"Stop"}')).status()).toBe(401)
  })

  test('malformed key', async ({ request }) => {
    expect((await post(request, 'not-a-key', '{"event":"Stop"}')).status()).toBe(401)
  })

  test('unknown key', async ({ request }) => {
    expect((await post(request, unknownKey, '{"event":"Stop"}')).status()).toBe(401)
  })

  test('invalid JSON', async ({ request }) => {
    expect((await post(request, unknownKey, '{nope')).status()).toBe(400)
  })

  test('missing event', async ({ request }) => {
    expect((await post(request, unknownKey, '{"tool":"Bash"}')).status()).toBe(400)
  })

  test('body over 1 KiB', async ({ request }) => {
    expect((await post(request, unknownKey, JSON.stringify({ event: 'x'.repeat(2000) }))).status()).toBe(413)
  })
})

signedIn.describe('ingest with a real key', () => {
  signedIn.skip(loadAllTestAccounts().length < 1, 'Needs a test account: npx deepspace test accounts create')

  signedIn('a key moves its pet, and a new key turns the old one off', async ({ users, request }) => {
    const [a] = await users(1)
    await a.page.goto('/home')
    await a.page.getByPlaceholder('Room name').fill(`Ingest ${Date.now()}`)
    await a.page.getByRole('button', { name: 'New room' }).click()
    await a.page.waitForURL(/\/r\/[0-9a-f-]{36}$/)

    const getKey = async () => {
      await a.page.getByRole('button', { name: 'Connect my agent' }).click()
      const text = await a.page.getByRole('dialog').textContent()
      await a.page.keyboard.press('Escape')
      return text?.match(/hp_[0-9a-f]{64}/)?.[0] ?? ''
    }

    const first = await getKey()
    signedInExpect((await post(request, first, '{"event":"PreToolUse","tool":"Bash"}')).status()).toBe(204)
    const card = a.page.getByTestId('pet-card').filter({ hasText: '(you)' })
    await signedInExpect(card).toHaveAttribute('data-activity', 'command')

    const second = await getKey()
    signedInExpect(second).not.toBe(first)
    signedInExpect((await post(request, first, '{"event":"Stop"}')).status()).toBe(401)
    signedInExpect((await post(request, second, '{"event":"Stop"}')).status()).toBe(204)
    await signedInExpect(card).toHaveAttribute('data-activity', 'waiting')
  })
})
