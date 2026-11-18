import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = '# huddle-pets'
const dir = join(homedir(), '.huddle-pets')
const configPath = join(dir, 'config.json')
const script = fileURLToPath(import.meta.url)
const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex')
const [mode, ...args] = process.argv.slice(2)

const agents = [
  {
    name: 'Claude Code',
    home: join(homedir(), '.claude'),
    file: join(homedir(), '.claude', 'settings.json'),
    events: ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest', 'PreCompact', 'Stop', 'StopFailure', 'SessionEnd'],
    group: () => ({ matcher: '*', hooks: [{ type: 'command', command: `node ${JSON.stringify(script)} ${TAG}` }] }),
  },
  {
    name: 'Codex',
    home: codexHome,
    file: join(codexHome, 'hooks.json'),
    events: ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'PreCompact', 'PostCompact', 'PreModelRequest', 'PostModelRequest', 'SubagentStart', 'SubagentStop', 'Stop', 'Interrupt'],
    group: () => ({ hooks: [{ type: 'command', command: `node ${JSON.stringify(script)} codex ${TAG}`, timeout: 2 }] }),
  },
]

const withoutOurHooks = (hooks = {}) =>
  Object.fromEntries(
    Object.entries(hooks)
      .map(([event, groups]) => [event, groups.map((g) => ({ ...g, hooks: g.hooks.filter((h) => !h.command?.endsWith(TAG)) })).filter((g) => g.hooks.length)])
      .filter(([, groups]) => groups.length),
  )

async function updateHooks(agent, addOurs) {
  const raw = await readFile(agent.file, 'utf8').catch(() => '{}')
  await mkdir(dirname(agent.file), { recursive: true })
  await writeFile(`${agent.file}.huddle-pets-backup`, raw)
  const settings = JSON.parse(raw)
  const hooks = withoutOurHooks(settings.hooks)
  if (addOurs) for (const event of agent.events) hooks[event] = [...(hooks[event] ?? []), agent.group()]
  await writeFile(agent.file, `${JSON.stringify({ ...settings, hooks }, null, 2)}\n`)
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

if (mode === 'install') {
  const [origin, key] = args
  if (origin || key) {
    if (!origin?.startsWith('http') || !key?.startsWith('hp_')) throw new Error('Usage: node hook.mjs install [<app url> <hook key>]')
    await mkdir(dir, { recursive: true })
    await writeFile(configPath, JSON.stringify({ origin, key }), { mode: 0o600 })
  } else if (!existsSync(configPath)) {
    throw new Error('Usage: node hook.mjs install <app url> <hook key>')
  }
  const found = agents.filter((a) => existsSync(a.home))
  const targets = found.length ? found : agents
  for (const agent of targets) await updateHooks(agent, true)
  const { origin: saved } = JSON.parse(await readFile(configPath, 'utf8'))
  console.log(`huddle-pets hook installed for ${targets.map((a) => a.name).join(' and ')} (${saved}).`)
  console.log(`Restart ${targets.map((a) => a.name).join(' and ')} to pick it up.`)
  if (targets.some((a) => a.name === 'Codex')) console.log('Codex will say the new hooks need review: open the hooks list and trust them.')
} else if (mode === 'uninstall') {
  for (const agent of agents) if (existsSync(agent.file)) await updateHooks(agent, false)
  console.log('huddle-pets hook removed.')
} else if (mode === 'send') {
  const { origin, key } = JSON.parse(await readFile(configPath, 'utf8'))
  await fetch(`${origin}/api/ingest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: args[0],
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
} else {
  const codex = mode === 'codex'
  try {
    const e = JSON.parse(await readStdin())
    const body = { event: e.hook_event_name, tool: e.tool_name, ...(codex && { status: e.status, subagent: !!e.agent_id }) }
    spawn(process.execPath, [script, 'send', JSON.stringify(body)], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
  } catch {}
  if (codex) process.stdout.write('{}\n')
}
