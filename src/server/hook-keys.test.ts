import { expect, it } from 'vitest'
import { HOOK_KEY_PATTERN, hashHookKey, newHookKey } from './hook-keys'

it('mints distinct keys in the expected format', () => {
  const [a, b] = [newHookKey(), newHookKey()]
  expect(a).toMatch(HOOK_KEY_PATTERN)
  expect(a).not.toBe(b)
})

it('hashes deterministically without exposing the key', async () => {
  const key = newHookKey()
  const hash = await hashHookKey(key)
  expect(hash).toMatch(/^[0-9a-f]{64}$/)
  expect(await hashHookKey(key)).toBe(hash)
  expect(hash).not.toContain(key.slice(3))
})
