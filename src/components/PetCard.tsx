import type { Activity, Member } from '../schemas/team-members-schema'

const looks: Record<Activity, { face: string; label: string }> = {
  idle: { face: '😴', label: 'Idle' },
  thinking: { face: '🤔', label: 'Thinking' },
  reading: { face: '📖', label: 'Reading' },
  searching: { face: '🔍', label: 'Searching' },
  editing: { face: '✏️', label: 'Editing' },
  command: { face: '⚙️', label: 'Running a command' },
  waiting: { face: '✅', label: 'Waiting for you' },
  permission: { face: '✋', label: 'Needs permission' },
  error: { face: '💥', label: 'Hit an error' },
}

export function PetCard({ member, updatedAt, isMe = false }: { member: Pick<Member, 'name' | 'activity' | 'tool'>; updatedAt: string; isMe?: boolean }) {
  const look = looks[member.activity] ?? looks.idle

  return (
    <li data-testid="pet-card" data-activity={member.activity} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
      <span className="text-5xl" aria-hidden>
        {look.face}
      </span>
      <span className="font-medium">
        {member.name}
        {isMe && <span className="text-muted-foreground"> (you)</span>}
      </span>
      <span className="text-sm">{look.label}</span>
      {member.tool && <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{member.tool}</span>}
      <time className="text-xs text-muted-foreground" dateTime={updatedAt}>
        {new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </time>
    </li>
  )
}
