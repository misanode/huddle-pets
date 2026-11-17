import type { Activity } from '../schemas/team-members-schema'

const toolActivities = new Map<string, Activity>([
  ['Read', 'reading'],
  ['NotebookRead', 'reading'],
  ['Grep', 'searching'],
  ['Glob', 'searching'],
  ['LS', 'searching'],
  ['WebSearch', 'searching'],
  ['WebFetch', 'searching'],
  ['Edit', 'editing'],
  ['MultiEdit', 'editing'],
  ['Write', 'editing'],
  ['NotebookEdit', 'editing'],
  ['Bash', 'command'],
  ['BashOutput', 'command'],
  ['PowerShell', 'command'],
])

const eventActivities = new Map<string, Activity>([
  ['SessionStart', 'idle'],
  ['SessionEnd', 'idle'],
  ['UserPromptSubmit', 'thinking'],
  ['PostToolUse', 'thinking'],
  ['PreCompact', 'thinking'],
  ['PostToolUseFailure', 'error'],
  ['StopFailure', 'error'],
  ['Stop', 'waiting'],
])

export function activityFor(event: string, tool: string): { activity: Activity; tool: string } | undefined {
  if (event === 'PreToolUse') return { activity: toolActivities.get(tool) ?? 'thinking', tool }
  if (event === 'PermissionRequest') return { activity: 'permission', tool }
  const activity = eventActivities.get(event)
  return activity && { activity, tool: '' }
}
