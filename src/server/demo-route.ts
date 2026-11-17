import type { Hono } from 'hono'
import type { AppContext } from '../../worker.js'
import { activityFor } from '../hook/activity.js'
import type { DemoPet } from '../schemas/demo-pets-schema.js'
import { createActionTools } from './action-routes.js'

const NAMES = ['Ana', 'Ben', 'Chen', 'Dee']
const EVENTS = [
  ['UserPromptSubmit', ''],
  ['PreToolUse', 'Read'],
  ['PreToolUse', 'Read'],
  ['PreToolUse', 'Grep'],
  ['PreToolUse', 'Edit'],
  ['PreToolUse', 'Edit'],
  ['PreToolUse', 'Bash'],
  ['PermissionRequest', 'Bash'],
  ['Stop', ''],
  ['PostToolUseFailure', ''],
] as const
const TICK_MS = 2500

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

export function registerDemoRoute(app: Hono<AppContext>): void {
  app.post('/api/demo/tick', async (c) => {
    const tools = createActionTools(c.env, 'demo', '')
    const pets = await tools.query<DemoPet>('demo_pets', { limit: NAMES.length })
    if (!pets.success) return c.body(null, 500)
    const { records } = pets.data

    const missing = NAMES.filter((name) => !records.some((r) => r.data.name === name))
    if (missing.length) {
      await Promise.all(missing.map((name) => tools.create<DemoPet>('demo_pets', { name, activity: 'idle', tool: '' })))
      return c.body(null, 204)
    }

    if (Date.now() - Math.max(...records.map((r) => Date.parse(r.updatedAt))) < TICK_MS) return c.body(null, 204)
    const [event, tool] = pick(EVENTS)
    const next = activityFor(event, tool)
    if (next) await tools.update<DemoPet>('demo_pets', pick(records).recordId, next)
    return c.body(null, 204)
  })
}
