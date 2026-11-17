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
