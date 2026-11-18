import type { Activity } from '../schemas/team-members-schema'

const toolActivities = new Map<string, Activity>([
  ['Read', 'reading'],
  ['NotebookRead', 'reading'],
  ['Grep', 'searching'],
  ['Glob', 'searching'],
  ['LS', 'searching'],
  ['WebSearch', 'searching'],
  ['WebFetch', 'searching'],
  ['ToolSearch', 'searching'],
  ['Edit', 'editing'],
  ['MultiEdit', 'editing'],
  ['Write', 'editing'],
  ['NotebookEdit', 'editing'],
  ['apply_patch', 'editing'],
  ['Bash', 'command'],
  ['BashOutput', 'command'],
  ['KillShell', 'command'],
  ['KillBash', 'command'],
  ['Monitor', 'command'],
  ['PowerShell', 'command'],
  ['exec_command', 'command'],
  ['shell_command', 'command'],
  ['shell', 'command'],
  ['write_stdin', 'command'],
])

const eventActivities = new Map<string, Activity>([
  ['SessionStart', 'idle'],
  ['SessionEnd', 'idle'],
  ['Interrupt', 'idle'],
  ['UserPromptSubmit', 'thinking'],
  ['PostToolUse', 'thinking'],
  ['PreCompact', 'thinking'],
  ['PostCompact', 'thinking'],
  ['PreModelRequest', 'thinking'],
  ['SubagentStart', 'thinking'],
  ['PostToolUseFailure', 'error'],
  ['StopFailure', 'error'],
  ['Stop', 'waiting'],
])

const modelRequestActivities = new Map<string, Activity>([
  ['failed', 'error'],
  ['cancelled', 'idle'],
])

type Extra = { status?: string; subagent?: boolean }

function baseActivity(event: string, tool: string, status: string): Activity | undefined {
  if (event === 'PreToolUse') return toolActivities.get(tool) ?? 'thinking'
  if (event === 'PermissionRequest') return 'permission'
  if (event === 'PostModelRequest') return modelRequestActivities.get(status)
  return eventActivities.get(event)
}

export function activityFor(event: string, rawTool: string, { status = '', subagent = false }: Extra = {}): { activity: Activity; tool: string } | undefined {
  const tool = rawTool.replace(/^functions\./, '')
  const activity = baseActivity(event, tool, status)
  if (!activity || (subagent && (activity === 'idle' || activity === 'waiting'))) return undefined
  return { activity, tool: event === 'PreToolUse' || event === 'PermissionRequest' ? tool : '' }
}
