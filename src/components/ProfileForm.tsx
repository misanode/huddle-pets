import { useState, type SubmitEvent } from 'react'
import { Button, Input, Label, useToast } from '@/components/ui'
import { useMyProfile, useSaveMyProfile } from '@/lib/display-name'
import { CITY_MAX, DISPLAY_NAME_MAX } from '../schemas/profiles-schema'

export function ProfileForm({ onSaved }: { onSaved?: () => void }) {
  const current = useMyProfile()
  const { save, ready } = useSaveMyProfile()
  const { success, error } = useToast()
  const [draft, setDraft] = useState<Partial<typeof current>>({})
  const [busy, setBusy] = useState(false)
  const name = draft.name ?? current.name
  const city = draft.city ?? current.city
  const unchanged = name.trim() === current.name && city.trim() === current.city

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await save({ name, city })
      success('Profile saved')
      setDraft({})
      onSaved?.()
    } catch (e) {
      error('Could not save your profile', e instanceof Error ? e.message : undefined)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input id="display-name" value={name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={DISPLAY_NAME_MAX} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">City (optional)</Label>
        <Input id="city" value={city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} maxLength={CITY_MAX} placeholder="Leave blank to show only your time zone" />
      </div>
      <p className="text-xs text-muted-foreground">Shown under your pet in every room you're in, next to your local time.</p>
      <Button type="submit" className="self-start" loading={busy} disabled={!ready || !name.trim() || unchanged}>
        Save
      </Button>
    </form>
  )
}
