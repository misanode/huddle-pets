import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { hashHookKey, newHookKey, type HookKey } from '../server/hook-keys'

export const actions: Record<string, ActionHandler<Env>> = {
  async createHookKey({ userId, params, tools }) {
    const where = { teamId: String(params.teamId ?? ''), userId }
    const member = await tools.query('team_members', { where, limit: 1 })
    if (!member.success) return member
    if (!member.data.records.length) return { success: false, error: 'Join the room first.' }

    const key = newHookKey()
    const keyHash = await hashHookKey(key)
    const existing = await tools.query<HookKey>('hook_keys', { where, limit: 1 })
    if (!existing.success) return existing
    const current = existing.data.records[0]
    const saved = current
      ? await tools.update<HookKey>('hook_keys', current.recordId, { keyHash })
      : await tools.create<HookKey>('hook_keys', { ...where, keyHash })
    return saved.success ? { success: true, data: { key } } : saved
  },
}
