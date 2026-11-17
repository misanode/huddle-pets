export type HookKey = { teamId: string; userId: string; keyHash: string }

export const HOOK_KEY_PATTERN = /^hp_[0-9a-f]{64}$/

const toHex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')

export const newHookKey = () => `hp_${toHex(crypto.getRandomValues(new Uint8Array(32)))}`

export const hashHookKey = async (key: string) => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))
