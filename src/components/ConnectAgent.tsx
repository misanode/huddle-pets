import { useState } from 'react'
import { getAuthToken } from 'deepspace'
import { Button, Modal, useToast } from '@/components/ui'

export function ConnectAgent({ teamId }: { teamId: string }) {
  const [key, setKey] = useState<string>()
  const [busy, setBusy] = useState(false)
  const { error, success } = useToast()

  const createKey = async () => {
    setBusy(true)
    const res = await fetch('/api/actions/createHookKey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getAuthToken()}` },
      body: JSON.stringify({ teamId }),
    })
    const result: { success: boolean; data?: { key: string }; error?: string } = await res.json()
    setBusy(false)
    if (result.data) setKey(result.data.key)
    else error('Could not create a hook key', result.error)
  }

  const testCommand = key && `curl -X POST ${location.origin}/api/ingest -H "Authorization: Bearer ${key}" -d '{"event":"PreToolUse","tool":"Bash"}'`

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    success('Copied')
  }

  return (
    <>
      <Button variant="outline" onClick={createKey} loading={busy}>
        Connect my agent
      </Button>
      <Modal open={!!key} onClose={() => setKey(undefined)} size="lg">
        <Modal.Title>Your hook key</Modal.Title>
        <Modal.Description>
          Shown once. Creating a new key replaces this one. Anyone with it can change your pet, so keep it private.
        </Modal.Description>
        <div className="mt-4 flex flex-col gap-3">
          <code data-testid="hook-key" className="break-all rounded bg-secondary p-3 text-xs">
            {key}
          </code>
          <p className="text-sm text-muted-foreground">Test it: your pet should switch to "Running a command".</p>
          <code className="break-all rounded bg-secondary p-3 text-xs">{testCommand}</code>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => key && copy(key)}>
              Copy key
            </Button>
            <Button onClick={() => testCommand && copy(testCommand)}>Copy test command</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
