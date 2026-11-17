import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = '# huddle-pets'
const EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest', 'PreCompact', 'Stop', 'StopFailure', 'SessionEnd']
const dir = join(homedir(), '.huddle-pets')
const configPath = join(dir, 'config.json')
const settingsPath = join(homedir(), '.claude', 'settings.json')
const script = fileURLToPath(import.meta.url)
const [mode, ...args] = process.argv.slice(2)

const withoutOurHooks = (hooks = {}) =>
  Object.fromEntries(
    Object.entries(hooks)
      .map(([event, groups]) => [event, groups.map((g) => ({ ...g, hooks: g.hooks.filter((h) => !h.command?.endsWith(TAG)) })).filter((g) => g.hooks.length)])
      .filter(([, groups]) => groups.length),
  )

async function updateSettings(addOurs) {
  const raw = await readFile(settingsPath, 'utf8').catch(() => '{}')
  await mkdir(join(homedir(), '.claude'), { recursive: true })
  await writeFile(`${settingsPath}.huddle-pets-backup`, raw)
  const settings = JSON.parse(raw)
  const hooks = withoutOurHooks(settings.hooks)
  if (addOurs) {
    const command = `node ${JSON.stringify(script)} ${TAG}`
    for (const event of EVENTS) hooks[event] = [...(hooks[event] ?? []), { matcher: '*', hooks: [{ type: 'command', command }] }]
  }
  await writeFile(settingsPath, `${JSON.stringify({ ...settings, hooks }, null, 2)}\n`)
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

if (mode === 'install') {
  const [origin, key] = args
  if (!origin?.startsWith('http') || !key?.startsWith('hp_')) throw new Error('Usage: node hook.mjs install <app url> <hook key>')
  await mkdir(dir, { recursive: true })
  await writeFile(configPath, JSON.stringify({ origin, key }), { mode: 0o600 })
  await updateSettings(true)
  console.log(`huddle-pets hook installed for ${origin}. Restart Claude Code to pick it up.`)
} else if (mode === 'uninstall') {
  await updateSettings(false)
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
  try {
    const { hook_event_name: event, tool_name: tool } = JSON.parse(await readStdin())
    spawn(process.execPath, [script, 'send', JSON.stringify({ event, tool })], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
  } catch {}
}
