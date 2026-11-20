import { useState, type SubmitEvent } from 'react'
import { Button, Input, Label, Modal, useToast } from '@/components/ui'
import { callAction } from '@/lib/actions'

export function InviteByEmail({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const { success, error } = useToast()

  const send = async (event: SubmitEvent) => {
    event.preventDefault()
    setBusy(true)
    const result = await callAction('inviteByEmail', { teamId, email: email.trim() }).catch(() => ({ success: false, error: undefined }))
    setBusy(false)
    if (!result.success) return error('Could not send the invite', result.error)
    success(`Invite sent to ${email.trim()}`)
    setEmail('')
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Invite by email
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} size="sm">
        <Modal.Title>Invite a teammate</Modal.Title>
        <Modal.Description>We'll email them a link to this room. They sign in, open the link and join.</Modal.Description>
        <form onSubmit={send} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Their email</Label>
            <Input id="invite-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" maxLength={254} required />
          </div>
          <Button type="submit" className="self-start" loading={busy} disabled={!email.trim()}>
            Send invite
          </Button>
          <p className="text-xs text-muted-foreground">You can send up to 10 invites a day. We don't keep their email address.</p>
        </form>
      </Modal>
    </>
  )
}
