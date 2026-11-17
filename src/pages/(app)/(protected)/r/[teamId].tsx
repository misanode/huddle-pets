import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth, useDisplayName, useMutations, useQuery } from 'deepspace'
import { Button, useToast } from '@/components/ui'
import type { Room } from '../../../../schemas/rooms-schema'
import { ACTIVITIES, type Member } from '../../../../schemas/team-members-schema'
import { PetCard } from '../../../../components/PetCard'
import { ConnectAgent } from '../../../../components/ConnectAgent'

const sampleTools: Partial<Record<Member['activity'], string>> = {
  reading: 'Read',
  searching: 'Grep',
  editing: 'Edit',
  command: 'Bash',
  permission: 'Bash',
}

export default function RoomPage() {
  const { teamId = '' } = useParams()
  const { userId } = useAuth()
  const { records, status } = useQuery<Member>('team_members', { where: { teamId, userId: userId ?? '' } })

  if (status !== 'ready') return null
  return records[0] ? <Room teamId={teamId} /> : <JoinRoom teamId={teamId} />
}

function JoinRoom({ teamId }: { teamId: string }) {
  const displayName = useDisplayName()
  const { ready, createConfirmed } = useMutations<Member>('team_members')
  const { error } = useToast()
  const [busy, setBusy] = useState(false)

  const join = async () => {
    setBusy(true)
    try {
      await createConfirmed({ teamId, name: (displayName ?? 'Teammate').slice(0, 40), activity: 'idle', tool: '' })
    } catch (e) {
      error('Could not join the room', e instanceof Error ? e.message : undefined)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold">You've been invited to a room</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Your pet will show your coding agent's activity to everyone in it.</p>
      <Button onClick={join} loading={busy} disabled={!ready}>
        Join room
      </Button>
    </div>
  )
}

function Room({ teamId }: { teamId: string }) {
  const { userId } = useAuth()
  const { records: rooms } = useQuery<Room>('rooms', { where: { teamId } })
  const { records: members } = useQuery<Member>('team_members', { where: { teamId }, orderBy: 'createdAt' })
  const { ready, put } = useMutations<Member>('team_members')
  const { success } = useToast()
  const me = members.find((m) => m.data.userId === userId)

  const simulate = () => {
    if (!me) return
    const options = ACTIVITIES.filter((a) => a !== me.data.activity)
    const activity = options[Math.floor(Math.random() * options.length)]
    put(me.recordId, { activity, tool: sampleTools[activity] ?? '' })
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(location.href)
    success('Room link copied')
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{rooms[0]?.data.name ?? 'Room'}</h1>
        <div className="flex flex-wrap gap-2">
          <ConnectAgent teamId={teamId} />
          <Button variant="outline" onClick={copyLink}>
            Copy invite link
          </Button>
          <Button onClick={simulate} disabled={!ready || !me}>
            Simulate activity
          </Button>
        </div>
      </header>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {members.map((m) => (
          <PetCard key={m.recordId} member={m.data} updatedAt={m.updatedAt} isMe={m.data.userId === userId} />
        ))}
      </ul>
    </div>
  )
}
