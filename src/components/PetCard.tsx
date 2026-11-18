import type { Activity, Member } from '../schemas/team-members-schema'
import { PetModel, usePetClip } from './PetModel'
import { Button } from './ui'

const faces: Record<Activity, string> = {
  idle: '😴',
  thinking: '🤔',
  reading: '📖',
  searching: '🔍',
  editing: '✏️',
  command: '⚙️',
  waiting: '✅',
  permission: '✋',
  error: '💥',
}

const phrases: Record<string, string> = {
  idle: 'Just hanging out.',
  happy: 'Life is good.',
  excited: 'Ooh, let’s go!',
  curious: 'What’s that?',
  sad: 'A little blue today.',
  coffee: 'Tiny coffee break.',
  workout: 'One more rep!',
  meditate: 'Finding my zen.',
  idea: 'Oh! I’ve got it!',
  dance: 'This is my song!',
  wave: 'Hey, you!',
  thinking: 'Hmm…',
  reading: 'Taking a look.',
  searching: 'Looking for clues.',
  typing: 'Typing something…',
  command: 'Running a command…',
  permission: 'Can I do this?',
  error: 'Oops. Hit a snag.',
  done: 'All done!',
  donehold: 'All done!',
}

type CardAction = { label: string; ariaLabel: string; onClick: () => void }
type Props = { member: Pick<Member, 'name' | 'activity' | 'tool'>; updatedAt: string; isMe?: boolean; action?: CardAction }

export function PetCard({ member, updatedAt, isMe = false, action }: Props) {
  const clip = usePetClip(member.activity)
  const phrase = phrases[clip] ?? phrases.idle

  return (
    <li data-testid="pet-card" data-activity={member.activity} className="relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} aria-label={action.ariaLabel} className="absolute right-2 top-2 z-10 text-muted-foreground">
          {action.label}
        </Button>
      )}
      <PetModel
        clip={clip}
        label={`${member.name}'s pet: ${phrase}`}
        fallback={
          <span className="text-5xl" aria-hidden>
            {faces[member.activity] ?? faces.idle}
          </span>
        }
      />
      <span className="font-medium">
        {member.name}
        {isMe && <span className="text-muted-foreground"> (you)</span>}
      </span>
      <span data-testid="pet-phrase" className="text-sm">
        {phrase}
      </span>
      {member.tool && <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{member.tool}</span>}
      <time className="text-xs text-muted-foreground" dateTime={updatedAt}>
        {new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </time>
    </li>
  )
}
