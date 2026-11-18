import { useState, type SubmitEvent } from 'react'
import { Button, Input, Label, useToast } from '@/components/ui'
import { useMyName, useSaveMyName } from '@/lib/display-name'
import { DISPLAY_NAME_MAX } from '../schemas/profiles-schema'

export function DisplayNameForm({ onSaved }: { onSaved?: () => void }) {
  const current = useMyName()
  const { save, ready } = useSaveMyName()
  const { success, error } = useToast()
  const [draft, setName] = useState<string>()
  const [busy, setBusy] = useState(false)
  const name = draft ?? current
  const trimmed = name.trim()

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await save(trimmed)
      success('Display name saved')
      setName(undefined)
      onSaved?.()
    } catch (e) {
      error('Could not save your name', e instanceof Error ? e.message : undefined)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Label htmlFor="display-name">Display name</Label>
      <div className="flex gap-2">
        <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={DISPLAY_NAME_MAX} required />
        <Button type="submit" loading={busy} disabled={!ready || !trimmed || trimmed === current}>
          Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Shown under your pet in every room you're in.</p>
    </form>
  )
}
