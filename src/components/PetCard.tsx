import type { Activity, Member } from '../schemas/team-members-schema'
import { PetModel } from './PetModel'
import { Button } from './ui'

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

type Props = { member: Pick<Member, 'name' | 'activity' | 'tool'>; updatedAt: string; isMe?: boolean; onRemove?: () => void }

export function PetCard({ member, updatedAt, isMe = false, onRemove }: Props) {
  const look = looks[member.activity] ?? looks.idle

  return (
    <li data-testid="pet-card" data-activity={member.activity} className="relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
      {onRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${member.name}`} className="absolute right-2 top-2 z-10 text-muted-foreground">
          Remove
        </Button>
      )}
      <PetModel
        activity={member.activity}
        label={`${member.name}'s pet, ${look.label.toLowerCase()}`}
        fallback={
          <span className="text-5xl" aria-hidden>
            {look.face}
          </span>
        }
      />
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
