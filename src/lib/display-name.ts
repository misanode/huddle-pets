import { useAuth, useDisplayName, useMutations, useQuery } from 'deepspace'
import { CITY_MAX, DISPLAY_NAME_MAX, type Profile } from '../schemas/profiles-schema'
import type { Member } from '../schemas/team-members-schema'

export type MyProfile = { name: string; city: string }

export function useMyProfile(): MyProfile {
  const { userId } = useAuth()
  const accountName = useDisplayName()
  const { records } = useQuery<Profile>('profiles', { where: { userId: userId ?? '' } })
  const profile = records[0]?.data
  return { name: (profile?.displayName || accountName || 'Teammate').slice(0, DISPLAY_NAME_MAX), city: profile?.city ?? '' }
}

export function useSaveMyProfile() {
  const { userId } = useAuth()
  const { records: profiles } = useQuery<Profile>('profiles', { where: { userId: userId ?? '' } })
  const { records: memberships } = useQuery<Member>('team_members', { where: { userId: userId ?? '' } })
  const profileWrites = useMutations<Profile>('profiles')
  const memberWrites = useMutations<Member>('team_members')

  const save = async ({ name, city }: MyProfile) => {
    const displayName = name.trim().slice(0, DISPLAY_NAME_MAX)
    const cleanCity = city.trim().slice(0, CITY_MAX)
    const profile = profiles[0]
    if (profile) await profileWrites.putConfirmed(profile.recordId, { displayName, city: cleanCity })
    else await profileWrites.createConfirmed({ displayName, city: cleanCity })
    const stale = memberships.filter((m) => m.data.name !== displayName || (m.data.city ?? '') !== cleanCity)
    await Promise.all(stale.map((m) => memberWrites.putConfirmed(m.recordId, { name: displayName, city: cleanCity })))
  }

  return { save, ready: profileWrites.ready && memberWrites.ready }
}
