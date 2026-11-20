# huddle-pets

A live room where every teammate has a 3D pet, and each pet copies what that person's Claude Code or Codex agent is doing right now: reading, editing, running a command, thinking, or waiting for them.

**Live app:** https://huddle-pets.app.space
**Demo (no sign-in):** https://huddle-pets.app.space/demo

Built on [DeepSpace](https://docs.deep.space) (SDK 0.43.0) for the DeepSpace build exercise.

## Try it

1. **Watch the demo.** Open [/demo](https://huddle-pets.app.space/demo). Four fake teammates' pets change every few seconds, and everyone watching sees the same thing.
2. **Make a room.** Sign in, go to **Home**, create a room and send the invite link to a teammate. They sign in and click **Join room**.
3. **Connect Claude Code or Codex.** In your room, click **Connect my agent** and follow the steps. You paste one command into a terminal (you need Node.js), then restart your agent. It sets up whichever of Claude Code and Codex you have; Codex asks you to trust the new hooks once. From then on, your pet follows your agent.

To remove it later: `node ~/.huddle-pets/hook.mjs uninstall`

## How it works

```
Claude Code ──hook──▶ hook.mjs ──sends {event, tool} + your key──▶ /api/ingest
                                                                    │ checks the key
                                                                    │ turns the event into an activity
                                                                    ▼
          everyone in the room sees it ◀──live update── your pet's row in the database
```

1. **The hook.** Claude Code can run a command on every event (a *hook*). Ours is `public/hook.mjs`. It only keeps two things, the event name and the tool name, and sends them in the background so Claude Code never waits.
2. **The ingest route.** `POST /api/ingest` (`src/server/ingest-route.ts`) checks your key, rejects anything too big or oddly shaped, works out the activity (for example `PreToolUse` + `Edit` → editing, in `src/hook/activity.ts`) and saves it on your pet's row.
3. **Live updates.** The rows live in a DeepSpace database (a *RecordRoom*). When a row changes, DeepSpace pushes the change to everyone allowed to see it, so the pets update without anyone refreshing.
4. **The pet.** `src/components/PetModel.tsx` shows my Lil Agent character (a 3D `.glb` file) and plays the animation for the current activity. Editing plays the typing animation.

## DeepSpace features used

| What the app needs | DeepSpace feature | Why |
|---|---|---|
| Know who you are | Sign-in (`AuthGate`) | So only you can move your pet, and rooms can be private |
| Pets update live | Records + `useQuery` | Changes are pushed to every viewer; no refreshing or polling |
| Only room members see a room | `'team'` permission | The server checks it, so it can't be bypassed from the browser |
| One pet per person, nobody can edit yours | `userBound`, `ownerField`, `uniqueOn`, `writableFields` | Checked by the server on every save |
| Make a hook key | Server action (`createHookKey`) | Runs on the server, so it can write to a table no user can read |
| Public demo | `'*': read` on `demo_pets` | Anyone can watch, only the server can change it |
| Limit request size | `readBoundedBodyText` | DeepSpace's own size-capped body reader |

**Built by hand, and why:**
- **The hook and `/api/ingest`:** a hook script can't sign in like a browser, and DeepSpace's own agent tokens need a DeepSpace account.
- **Hook keys:** stored as hashes.
- **The demo timer:** DeepSpace cron runs at most once a minute, too slow to look alive.
- **The pet build script.**

**Not used:** messaging, file uploads, Yjs and payments wouldn't add anything to this app. An AI daily summary of each room was planned but isn't built.

## Privacy and security

- **The hook only sends the event name and tool name:** never file paths, commands, prompts or file contents. I tested this: the hook got a folder path and a `.env` path, and all it sent was `{"event":"PreToolUse","tool":"Read"}`.
- **Hook keys are long random strings, shown once.** The server only stores a *hash* (a one-way fingerprint) of each key, in a table no user can read. Making a new key turns the old one off.
- **Room links use a random ID,** so they can't be guessed.
- **No secrets are in the repo.** The app doesn't need any API keys.

## Tradeoffs and what's missing

- **You need to sign in to join a room.** DeepSpace gives signed-out visitors a new ID every time they connect, so guest rooms would need custom sign-in code everywhere. I made the public demo room instead.
- **`/api/ingest` has no rate limit yet.** Requests are size-capped and need a valid key to change anything, but lots of bad requests still each cost a database lookup. Next step: Cloudflare's rate-limit feature.
- **The pet file is 3.9 MB,** down from 12 MB. It loads once, and only on pages with pets.
- **Anyone can call the demo timer,** but it only moves the four demo pets, and the server ignores calls within 2.5 seconds of the last change.
- **The Windows install command hasn't been tested yet.**

## Run it yourself

```sh
npm install
npx deepspace dev start            # http://127.0.0.1:5173
npx tsc --noEmit && npx vitest run # type check + unit tests
npx deepspace test run             # smoke + API tests
npx deepspace test run e2e         # demo and ingest tests (room tests need test accounts)
```

If you change the pet model, rebuild it:

```sh
node scripts/build-pet.mjs path/to/lilagent.glb
```

The script keeps the 9 animations the app uses and builds in the right face for each one. The desktop app picks faces in code, so the web version needs them saved in the file. It also removes props those animations never show, and shrinks the file.

## Credits

The pet is Lil Agent, my own character from my Lil Agent desktop app. Everything else here was written for this project.
