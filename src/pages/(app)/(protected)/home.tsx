import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDisplayName, useMutations, useQuery } from 'deepspace'
import { Button, Input, useToast } from '@/components/ui'
import type { Room } from '../../../schemas/rooms-schema'
import type { Member } from '../../../schemas/team-members-schema'

export default function HomePage() {
  const navigate = useNavigate()
  const displayName = useDisplayName()
  const { error } = useToast()
  const { records: rooms, status } = useQuery<Room>('rooms', { orderBy: 'createdAt', orderDir: 'desc' })
  const createRoom = useMutations<Room>('rooms')
  const createMember = useMutations<Member>('team_members')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    setBusy(true)
    const teamId = crypto.randomUUID()
    try {
      await createRoom.createConfirmed({ teamId, name: name.trim() })
      await createMember.createConfirmed({ teamId, name: (displayName ?? 'Teammate').slice(0, 40), activity: 'idle', tool: '' })
      navigate(`/r/${teamId}`)
    } catch (e) {
      error('Could not create the room', e instanceof Error ? e.message : undefined)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-10">
      <form onSubmit={submit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Room name" required />
        <Button type="submit" loading={busy} disabled={!createRoom.ready || !name.trim()}>
          New room
        </Button>
      </form>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Your rooms</h2>
        {status === 'ready' && rooms.length === 0 && (
          <p className="text-sm text-muted-foreground">No rooms yet. Create one, or open a room link from a teammate.</p>
        )}
        {rooms.map((room) => (
          <Link key={room.recordId} to={`/r/${room.data.teamId}`} className="rounded-lg border border-border bg-card px-4 py-3 hover:bg-secondary">
            {room.data.name}
          </Link>
        ))}
      </section>
    </div>
  )
}
