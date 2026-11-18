import type { Hono } from 'hono'
import { BodyTooLargeError, readBoundedBodyText } from 'deepspace/worker'
import type { AppContext } from '../../worker.js'
import { activityFor } from '../hook/activity.js'
import type { Member } from '../schemas/team-members-schema.js'
import { createActionTools } from './action-routes.js'
import { HOOK_KEY_PATTERN, hashHookKey, type HookKey } from './hook-keys.js'

const TOOL_PATTERN = /^[\w.:-]{1,64}$/

export function registerIngestRoute(app: Hono<AppContext>): void {
  app.post('/api/ingest', async (c) => {
    const key = c.req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1]
    if (!key || !HOOK_KEY_PATTERN.test(key)) return c.body(null, 401)

    let body: { event?: unknown; tool?: unknown; status?: unknown; subagent?: unknown }
    try {
      body = JSON.parse(await readBoundedBodyText(c.req.raw, 1024)) ?? {}
    } catch (e) {
      return c.body(null, e instanceof BodyTooLargeError ? 413 : 400)
    }
    if (typeof body.event !== 'string') return c.body(null, 400)
    const tool = typeof body.tool === 'string' && TOOL_PATTERN.test(body.tool) ? body.tool : ''

    const tools = createActionTools(c.env, 'hook-ingest', '')
    const keys = await tools.query<HookKey>('hook_keys', { where: { keyHash: await hashHookKey(key) }, limit: 1 })
    const owner = keys.success ? keys.data.records[0]?.data : undefined
    if (!owner) return c.body(null, 401)
    const members = await tools.query<Member>('team_members', { where: { teamId: owner.teamId, userId: owner.userId }, limit: 1 })
    const member = members.success ? members.data.records[0] : undefined
    if (!member || member.data.status === 'removed') return c.body(null, 401)

    const status = typeof body.status === 'string' ? body.status : ''
    const next = activityFor(body.event, tool, { status, subagent: body.subagent === true })
    if (next && (next.activity !== member.data.activity || next.tool !== member.data.tool)) {
      await tools.update<Member>('team_members', member.recordId, next)
    }
    return c.body(null, 204)
  })
}
