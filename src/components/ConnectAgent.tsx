import { useState } from 'react'
import { Button, Modal, useToast } from '@/components/ui'
import { callAction } from '@/lib/actions'

export function ConnectAgent({ teamId }: { teamId: string }) {
  const [key, setKey] = useState<string>()
  const [busy, setBusy] = useState(false)
  const { error, success } = useToast()

  const createKey = async () => {
    setBusy(true)
    const result = await callAction<{ key: string }>('createHookKey', { teamId })
    setBusy(false)
    if (result.data) setKey(result.data.key)
    else error('Could not create a hook key', result.error)
  }

  const installCommands = !key ? [] : [
    { label: 'macOS / Linux', command: `curl -fsSL --create-dirs -o ~/.huddle-pets/hook.mjs ${location.origin}/hook.mjs && node ~/.huddle-pets/hook.mjs install ${location.origin} ${key}` },
    { label: 'Windows (PowerShell)', command: `mkdir -Force ~\\.huddle-pets | Out-Null; curl.exe -fsSL -o ~\\.huddle-pets\\hook.mjs ${location.origin}/hook.mjs; node ~\\.huddle-pets\\hook.mjs install ${location.origin} ${key}` },
  ]

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    success('Copied')
  }

  return (
    <>
      <Button onClick={createKey} loading={busy}>
        Connect my agent
      </Button>
      <Modal open={!!key} onClose={() => setKey(undefined)} size="lg">
        <Modal.Title>Connect Claude Code or Codex to your pet</Modal.Title>
        <Modal.Description>Your personal hook key is inside the commands below. It's shown only once, so finish these steps now.</Modal.Description>
        <ol className="mt-4 flex list-decimal flex-col gap-4 pl-5 text-sm marker:font-semibold">
          <li>
            Open a terminal: <b>Terminal</b> on Mac, <b>PowerShell</b> on Windows. You need Node.js; check with <code>node -v</code>.
          </li>
          <li className="flex flex-col gap-3">
            Copy the command for your computer, paste it into the terminal and press Enter.
            {installCommands.map(({ label, command }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{label}</span>
                  <Button size="sm" variant="outline" onClick={() => copy(command)}>
                    Copy
                  </Button>
                </div>
                <code className="break-all rounded bg-secondary p-3 text-xs">{command}</code>
              </div>
            ))}
            <span className="text-muted-foreground">
              You should see <code>huddle-pets hook installed</code> followed by the agents it found: Claude Code, Codex, or both.
            </span>
          </li>
          <li>Quit your agent completely and open it again.</li>
          <li>In Codex, you'll be told the new hooks need review. Open the hooks list and trust the huddle-pets hooks, or they won't run.</li>
          <li>Use your agent as usual. Your pet on this page now shows what it's doing.</li>
        </ol>
        <div className="mt-5 flex flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>Only the event name and tool name are sent, never your files, commands or prompts.</p>
          <p>Keep the key private: anyone with it can change your pet. Clicking "Connect my agent" again makes a new key and turns this one off.</p>
          <p>
            Installed the other agent later? Run <code>node ~/.huddle-pets/hook.mjs install</code> to connect it with the same key.
          </p>
          <p>
            To remove the hook from both agents: <code>node ~/.huddle-pets/hook.mjs uninstall</code>
          </p>
        </div>
      </Modal>
    </>
  )
}
