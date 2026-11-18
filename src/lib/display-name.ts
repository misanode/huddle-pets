import { useAuth, useDisplayName, useMutations, useQuery } from 'deepspace'
import { DISPLAY_NAME_MAX, type Profile } from '../schemas/profiles-schema'
import type { Member } from '../schemas/team-members-schema'

export function useMyName() {
  const { userId } = useAuth()
  const accountName = useDisplayName()
  const { records } = useQuery<Profile>('profiles', { where: { userId: userId ?? '' } })
  return (records[0]?.data.displayName || accountName || 'Teammate').slice(0, DISPLAY_NAME_MAX)
}

export function useSaveMyName() {
  const { userId } = useAuth()
  const { records: profiles } = useQuery<Profile>('profiles', { where: { userId: userId ?? '' } })
  const { records: memberships } = useQuery<Member>('team_members', { where: { userId: userId ?? '' } })
  const profileWrites = useMutations<Profile>('profiles')
  const memberWrites = useMutations<Member>('team_members')

  const save = async (raw: string) => {
    const displayName = raw.trim().slice(0, DISPLAY_NAME_MAX)
    const profile = profiles[0]
    if (profile) await profileWrites.putConfirmed(profile.recordId, { displayName })
    else await profileWrites.createConfirmed({ displayName })
    await Promise.all(memberships.filter((m) => m.data.name !== displayName).map((m) => memberWrites.putConfirmed(m.recordId, { name: displayName })))
  }

  return { save, ready: profileWrites.ready && memberWrites.ready }
}
