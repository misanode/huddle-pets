import { expect, it } from 'vitest'
import { activityFor } from './activity'

it.each([
  ['PreToolUse', 'Read', { activity: 'reading', tool: 'Read' }],
  ['PreToolUse', 'Grep', { activity: 'searching', tool: 'Grep' }],
  ['PreToolUse', 'Edit', { activity: 'editing', tool: 'Edit' }],
  ['PreToolUse', 'Bash', { activity: 'command', tool: 'Bash' }],
  ['PreToolUse', 'mcp__figma__use_figma', { activity: 'thinking', tool: 'mcp__figma__use_figma' }],
  ['PermissionRequest', 'Bash', { activity: 'permission', tool: 'Bash' }],
  ['UserPromptSubmit', 'Bash', { activity: 'thinking', tool: '' }],
  ['PostToolUseFailure', '', { activity: 'error', tool: '' }],
  ['Stop', '', { activity: 'waiting', tool: '' }],
  ['SessionEnd', '', { activity: 'idle', tool: '' }],
])('%s %s', (event, tool, expected) => {
  expect(activityFor(event, tool)).toEqual(expected)
})

it.each(['Notification', 'constructor', '__proto__', ''])('ignores %j', (event) => {
  expect(activityFor(event, '')).toBeUndefined()
})

it.each([
  ['PreToolUse', 'exec_command', '', { activity: 'command', tool: 'exec_command' }],
  ['PreToolUse', 'functions.shell', '', { activity: 'command', tool: 'shell' }],
  ['PreToolUse', 'apply_patch', '', { activity: 'editing', tool: 'apply_patch' }],
  ['PreModelRequest', '', '', { activity: 'thinking', tool: '' }],
  ['PostCompact', '', '', { activity: 'thinking', tool: '' }],
  ['SubagentStart', '', '', { activity: 'thinking', tool: '' }],
  ['PostModelRequest', '', 'failed', { activity: 'error', tool: '' }],
  ['PostModelRequest', '', 'cancelled', { activity: 'idle', tool: '' }],
  ['PostModelRequest', '', 'completed', undefined],
  ['Interrupt', '', '', { activity: 'idle', tool: '' }],
  ['SubagentStop', '', '', undefined],
])('codex %s %s %s', (event, tool, status, expected) => {
  expect(activityFor(event, tool, { status })).toEqual(expected)
})

it('a codex subagent shows work but never ends the parent turn', () => {
  expect(activityFor('PreToolUse', 'exec_command', { subagent: true })).toEqual({ activity: 'command', tool: 'exec_command' })
  for (const event of ['Stop', 'Interrupt', 'SessionStart', 'SessionEnd']) expect(activityFor(event, '', { subagent: true })).toBeUndefined()
  expect(activityFor('PostModelRequest', '', { status: 'cancelled', subagent: true })).toBeUndefined()
})
