import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth, useMutations, useQuery } from 'deepspace'
import { Button, ConfirmModal, Modal, buttonVariants, useToast } from '@/components/ui'
import { ProfileForm } from '@/components/ProfileForm'
import { Hero } from '@/components/Hero'
import { PageHeader } from '@/components/PageHeader'
import { PetGrid } from '@/components/PetGrid'
import { callAction } from '@/lib/actions'
import { useMyProfile } from '@/lib/display-name'
import { localTimeZone } from '@/lib/time-zone'
import type { Room } from '../../../../schemas/rooms-schema'
import { ACTIVITIES, type Member } from '../../../../schemas/team-members-schema'
import { PetCard } from '../../../../components/PetCard'
import { ConnectAgent } from '../../../../components/ConnectAgent'
import { InviteByEmail } from '../../../../components/InviteByEmail'

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

type RoomStatus = { exists: boolean; removed: boolean }

function JoinRoom({ teamId }: { teamId: string }) {
  const [status, setStatus] = useState<RoomStatus>()

  useEffect(() => {
    callAction<RoomStatus>('roomStatus', { teamId }).then(
      (result) => setStatus(result.data ?? { exists: true, removed: false }),
      () => setStatus({ exists: true, removed: false }),
    )
  }, [teamId])

  if (!status) return null
  if (!status.exists) return <RoomNotice title="This room no longer exists" body="The owner deleted it. Ask them for a new invite link." />
  if (status.removed) return <RoomNotice title="You were removed from this room" body="Ask the room owner if you think this is a mistake." />
  return <JoinPrompt teamId={teamId} />
}

function RoomNotice({ title, body }: { title: string; body: string }) {
  return (
    <Hero title={title} body={body}>
      <Link to="/home" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
        Back to your rooms
      </Link>
    </Hero>
  )
}

function JoinPrompt({ teamId }: { teamId: string }) {
  const mine = useMyProfile()
  const { ready, createConfirmed } = useMutations<Member>('team_members')
  const { error } = useToast()
  const [busy, setBusy] = useState(false)

  const join = async () => {
    setBusy(true)
    try {
      await createConfirmed({ teamId, name: mine.name, city: mine.city, activity: 'idle', tool: '', timeZone: localTimeZone() })
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      if (message.startsWith('Duplicate')) error('You were removed from this room', 'Ask the room owner if you think this is a mistake.')
      else error('Could not join the room', message || undefined)
      setBusy(false)
    }
  }

  return (
    <Hero title="You’ve been invited to a room" body="Your pet will show your coding agent’s activity to everyone in it.">
      <Button size="lg" onClick={join} loading={busy} disabled={!ready}>
        Join room
      </Button>
    </Hero>
  )
}

function Room({ teamId }: { teamId: string }) {
  const { userId } = useAuth()
  const { records: rooms } = useQuery<Room>('rooms', { where: { teamId } })
  const { records } = useQuery<Member>('team_members', { where: { teamId }, orderBy: 'createdAt' })
  const { ready, put } = useMutations<Member>('team_members')
  const { success, error } = useToast()
  const [removing, setRemoving] = useState<{ id: string; name: string }>()
  const [renaming, setRenaming] = useState(false)
  const [busy, setBusy] = useState(false)
  const members = records.filter((m) => m.data.status !== 'removed')
  const me = members.find((m) => m.data.userId === userId)
  const isOwner = !!userId && rooms[0]?.createdBy === userId
  const myRecordId = me?.recordId
  const myTimeZone = me?.data.timeZone

  useEffect(() => {
    const timeZone = localTimeZone()
    if (ready && myRecordId && myTimeZone !== timeZone) put(myRecordId, { timeZone }).catch(() => {})
  }, [ready, myRecordId, myTimeZone, put])

  const remove = async () => {
    if (!removing) return
    setBusy(true)
    const result = await callAction('removeMember', { teamId, memberId: removing.id })
    setBusy(false)
    if (!result.success) return error(`Could not remove ${removing.name}`, result.error)
    success(`${removing.name} was removed`)
    setRemoving(undefined)
  }

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
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:py-12">
      <PageHeader title={rooms[0]?.data.name ?? 'Room'} subtitle={`${members.length} ${members.length === 1 ? 'pet' : 'pets'} in this room`}>
        <div className="hidden sm:contents">
          <ConnectAgent teamId={teamId} />
        </div>
        <InviteByEmail teamId={teamId} />
        <Button variant="outline" onClick={copyLink}>
          Copy invite link
        </Button>
        <div className="hidden sm:contents">
          <Button variant="outline" onClick={simulate} disabled={!ready || !me}>
            Simulate activity
          </Button>
        </div>
      </PageHeader>
      <PetGrid>
        {members.map((m) => {
          const isMe = m.data.userId === userId
          const action = isMe
            ? { label: 'Edit', ariaLabel: 'Edit your name and city', onClick: () => setRenaming(true) }
            : isOwner
              ? { label: 'Remove', ariaLabel: `Remove ${m.data.name}`, onClick: () => setRemoving({ id: m.recordId, name: m.data.name }) }
              : undefined
          return <PetCard key={m.recordId} member={m.data} updatedAt={m.updatedAt} isMe={isMe} action={action} />
        })}
      </PetGrid>
      <Modal open={renaming} onClose={() => setRenaming(false)} size="sm">
        <Modal.Title>Edit your profile</Modal.Title>
        <div className="mt-4">
          <ProfileForm onSaved={() => setRenaming(false)} />
        </div>
      </Modal>
      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(undefined)}
        onConfirm={remove}
        loading={busy}
        title={`Remove ${removing?.name ?? ''}?`}
        description="Their pet leaves the room, their agent hook stops working here, and they can't rejoin from the invite link."
        confirmText="Remove"
      />
    </div>
  )
}
