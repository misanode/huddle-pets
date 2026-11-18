import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useMutations, useQuery } from 'deepspace'
import { Button, ConfirmModal, Input, SearchInput, useToast } from '@/components/ui'
import { callAction } from '@/lib/actions'
import { PageHeader } from '@/components/PageHeader'
import { useMyProfile } from '@/lib/display-name'
import { localTimeZone } from '@/lib/time-zone'
import type { Room } from '../../../schemas/rooms-schema'
import type { Member } from '../../../schemas/team-members-schema'

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function HomePage() {
  const navigate = useNavigate()
  const mine = useMyProfile()
  const { userId } = useAuth()
  const { error, success } = useToast()
  const { records: rooms, status } = useQuery<Room>('rooms', { orderBy: 'createdAt', orderDir: 'desc' })
  const createRoom = useMutations<Room>('rooms')
  const createMember = useMutations<Member>('team_members')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<{ teamId: string; name: string }>()
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [query, setQuery] = useState('')
  const needle = fold(query.trim())
  const shown = needle ? rooms.filter((room) => fold(room.data.name).includes(needle)) : rooms

  const deleteRoom = async () => {
    if (!deleting) return
    setDeletingBusy(true)
    const result = await callAction('deleteRoom', { teamId: deleting.teamId })
    setDeletingBusy(false)
    if (!result.success) return error(`Could not delete ${deleting.name}`, result.error)
    success(`${deleting.name} was deleted`)
    setDeleting(undefined)
  }

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    setBusy(true)
    const teamId = crypto.randomUUID()
    try {
      await createRoom.createConfirmed({ teamId, name: name.trim() })
      await createMember.createConfirmed({ teamId, name: mine.name, city: mine.city, activity: 'idle', tool: '', timeZone: localTimeZone() })
      navigate(`/r/${teamId}`)
    } catch (e) {
      error('Could not create the room', e instanceof Error ? e.message : undefined)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-12">
      <PageHeader title="Your rooms" subtitle="Each room shows your teammates' pets, live." />
      <form onSubmit={submit} className="surface flex gap-2 rounded-2xl p-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Room name" required />
        <Button type="submit" loading={busy} disabled={!createRoom.ready || !name.trim()}>
          New room
        </Button>
      </form>
      <section className="flex flex-col gap-2.5">
        {status === 'ready' && rooms.length === 0 && (
          <p className="text-center text-sm font-light text-muted-foreground">No rooms yet. Create one, or open a room link from a teammate.</p>
        )}
        {rooms.length > 0 && (
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search your rooms" aria-label="Search your rooms" />
        )}
        {rooms.length > 0 && shown.length === 0 && (
          <p className="text-center text-sm font-light text-muted-foreground">No rooms match “{query.trim()}”.</p>
        )}
        {shown.map((room) => (
          <div key={room.recordId} data-testid="room-row" className="surface flex items-center rounded-2xl transition hover:brightness-125">
            <Link to={`/r/${room.data.teamId}`} className="min-w-0 flex-1 truncate px-5 py-4 text-base font-medium">
              {room.data.name}
            </Link>
            {room.createdBy === userId && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${room.data.name}`}
                onClick={() => setDeleting({ teamId: room.data.teamId, name: room.data.name })}
              >
                Delete
              </Button>
            )}
          </div>
        ))}
      </section>
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={deleteRoom}
        loading={deletingBusy}
        title={`Delete ${deleting?.name ?? ''}?`}
        description="Everyone in it loses access, their agent hooks stop sending here, and the invite link stops working. This can't be undone."
        confirmText="Delete room"
      />
    </div>
  )
}
