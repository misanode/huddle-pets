import type { Activity, Member } from '../schemas/team-members-schema'
import { PetModel, usePetClip } from './PetModel'
import { useNow, zoneClock } from '@/lib/time-zone'
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

const toolLabels: Record<string, string> = {
  Read: 'Reading…',
  NotebookRead: 'Reading…',
  Edit: 'Editing…',
  MultiEdit: 'Editing…',
  NotebookEdit: 'Editing…',
  apply_patch: 'Editing…',
  Write: 'Writing…',
  Grep: 'Searching…',
  Glob: 'Finding files…',
  LS: 'Listing files…',
  ToolSearch: 'Searching…',
  WebSearch: 'Searching the web…',
  WebFetch: 'Fetching…',
}

type CardAction = { label: string; ariaLabel: string; onClick: () => void }
type Props = { member: Pick<Member, 'name' | 'activity' | 'tool' | 'timeZone' | 'city'>; updatedAt: string; isMe?: boolean; action?: CardAction }

export function PetCard({ member, updatedAt, isMe = false, action }: Props) {
  const clip = usePetClip(member.activity)
  const phrase = phrases[clip] ?? phrases.idle
  const clock = zoneClock(member.timeZone, useNow())
  const updated = new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <li data-testid="pet-card" data-activity={member.activity} className="surface relative flex min-w-0 flex-col items-center gap-1.5 rounded-3xl p-3 text-center sm:gap-2 sm:p-5">
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} aria-label={action.ariaLabel} className="absolute right-1 top-1 z-10 h-8 px-2 text-muted-foreground sm:right-2 sm:top-2 sm:h-9 sm:px-3">
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
      <span className="w-full truncate text-sm font-semibold sm:text-base">
        {member.name}
        {isMe && <span className="text-muted-foreground"> (you)</span>}
      </span>
      <span data-testid="pet-phrase" className="w-full truncate text-sm">
        {phrase}
      </span>
      <span className={`h-5 max-w-full truncate rounded-md px-2 text-xs font-medium leading-5 ${member.tool ? 'bg-white/[0.06] ring-1 ring-inset ring-white/10' : 'invisible'}`} aria-hidden={!member.tool}>
        {member.tool ? (toolLabels[member.tool] ?? member.tool) : '·'}
      </span>
      <div className="mt-auto flex w-full flex-col items-center text-xs leading-4 text-muted-foreground" title={`Last update ${updated} your time`}>
        {clock ? (
          <span data-testid="pet-clock" className="whitespace-nowrap tabular-nums">
            <span aria-hidden>{clock.night ? '🌙' : '☀️'}</span> {clock.time}
          </span>
        ) : (
          <time className="tabular-nums" dateTime={updatedAt}>
            {updated}
          </time>
        )}
        <span data-testid="pet-city" className="h-4 w-full truncate">
          {member.city}
        </span>
      </div>
    </li>
  )
}
