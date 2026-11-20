import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { hashHookKey, newHookKey, type HookKey } from '../server/hook-keys'
import type { Room } from '../schemas/rooms-schema'
import type { Member } from '../schemas/team-members-schema'
import type { EmailInvite } from '../schemas/email-invites-schema'
import { INVITES_PER_DAY, inviteMessage, isEmail } from '../server/invite-email'

export const actions: Record<string, ActionHandler<Env>> = {
  async createHookKey({ userId, params, tools }) {
    const where = { teamId: String(params.teamId ?? ''), userId }
    const member = await tools.query<Member>('team_members', { where, limit: 1 })
    if (!member.success) return member
    const record = member.data.records[0]
    if (!record || record.data.status === 'removed') return { success: false, error: 'Join the room first.' }

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

  async removeMember({ userId, params, tools }) {
    const teamId = String(params.teamId ?? '')
    const rooms = await tools.query<Room>('rooms', { where: { teamId }, limit: 1 })
    if (!rooms.success) return rooms
    if (rooms.data.records[0]?.createdBy !== userId) return { success: false, error: 'Only the room owner can remove people.' }

    const found = await tools.get<Member>('team_members', String(params.memberId ?? ''))
    if (!found.success) return found
    const member = found.data.record.data
    if (member.teamId !== teamId || !member.userId) return { success: false, error: 'That person is not in this room.' }
    if (member.userId === userId) return { success: false, error: "You can't remove yourself." }

    const removed = await tools.update<Member>('team_members', found.data.record.recordId, { status: 'removed', activity: 'idle', tool: '' })
    if (!removed.success) return removed
    const keys = await tools.deleteWhere('hook_keys', { teamId, userId: member.userId })
    return keys.success ? { success: true, data: null } : keys
  },

  async deleteRoom({ userId, params, tools }) {
    const teamId = String(params.teamId ?? '')
    const rooms = await tools.query<Room>('rooms', { where: { teamId }, limit: 1 })
    if (!rooms.success) return rooms
    const room = rooms.data.records[0]
    if (!room) return { success: false, error: 'That room no longer exists.' }
    if (room.createdBy !== userId) return { success: false, error: 'Only the room owner can delete it.' }

    for (const collection of ['hook_keys', 'team_members']) {
      for (;;) {
        const drained = await tools.deleteWhere(collection, { teamId }, 500)
        if (!drained.success) return drained
        if (drained.data.deleted < 500) break
      }
    }
    const removed = await tools.remove('rooms', room.recordId)
    return removed.success ? { success: true, data: null } : removed
  },

  async inviteByEmail({ userId, params, tools, env }) {
    const teamId = String(params.teamId ?? '')
    const email = String(params.email ?? '').trim()
    if (!isEmail(email)) return { success: false, error: 'That doesn’t look like an email address.' }

    const members = await tools.query<Member>('team_members', { where: { teamId, userId }, limit: 1 })
    if (!members.success) return members
    const member = members.data.records[0]
    if (!member || member.data.status === 'removed') return { success: false, error: 'Join the room first.' }

    const recent = await tools.query<EmailInvite>('email_invites', { where: { userId }, orderBy: 'createdAt', orderDir: 'desc', limit: INVITES_PER_DAY })
    if (!recent.success) return recent
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    if (recent.data.records.filter((r) => Date.parse(r.createdAt) > dayAgo).length >= INVITES_PER_DAY)
      return { success: false, error: `You can send up to ${INVITES_PER_DAY} invites a day. Try again tomorrow, or copy the invite link instead.` }

    const rooms = await tools.query<Room>('rooms', { where: { teamId }, limit: 1 })
    if (!rooms.success) return rooms
    const room = rooms.data.records[0]
    if (!room) return { success: false, error: 'That room no longer exists.' }

    const link = `https://${env.APP_NAME}.app.space/r/${teamId}`
    const sent = await tools.integration('email/send', { to: email, ...inviteMessage({ inviter: member.data.name, room: room.data.name, link }) })
    if (!sent.success) return sent
    await tools.create<EmailInvite>('email_invites', { teamId, userId })
    return { success: true, data: null }
  },

  async roomStatus({ userId, params, tools }) {
    const teamId = String(params.teamId ?? '')
    const rooms = await tools.query<Room>('rooms', { where: { teamId }, limit: 1 })
    if (!rooms.success) return rooms
    const members = await tools.query<Member>('team_members', { where: { teamId, userId }, limit: 1 })
    if (!members.success) return members
    return { success: true, data: { exists: rooms.data.records.length > 0, removed: members.data.records[0]?.data.status === 'removed' } }
  },
}
