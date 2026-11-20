# huddle-pets

huddle-pets is a shared room for your team where everyone has a little 3D pet. Each pet copies what that person's coding agent (Claude Code or Codex) is doing right now: reading files, editing, running a command, thinking, or waiting for them. When nobody's agent is busy, the pets just hang out and do their own thing.

**Live app:** https://huddle-pets.app.space
**Demo (no sign-in needed):** https://huddle-pets.app.space/demo

I built it on [DeepSpace](https://docs.deep.space) (SDK 0.43.0) for the DeepSpace build exercise. It's the online, multiplayer version of Lil Agent, a desktop pet app I made for myself.

## Try it

1. **Watch the demo.** Open [/demo](https://huddle-pets.app.space/demo). Four fake teammates' pets change every few seconds, and everyone watching sees the same thing.
2. **Make a room.** Sign in, go to **Rooms**, make a room and send the invite link to a teammate. They sign in, open the link and click **Join room**.
3. **Connect your agent.** In the room, click **Connect my agent** and copy the command for your computer (Mac or Windows). Paste it into a terminal, then restart Claude Code or Codex. You need Node.js. Codex will ask you to trust the new hooks once. After that, your pet follows your agent.

To remove it later, run `node ~/.huddle-pets/hook.mjs uninstall` on a Mac, or `node "$HOME\.huddle-pets\hook.mjs" uninstall` in PowerShell.

## What you get

- **A pet per person** that reacts to your agent: reading, searching, editing, running a command, thinking, asking for permission, or hitting an error. When the agent finishes, a checkmark pops up on the pet's head.
- **Pets that look alive when nobody's working.** Idle pets drink coffee, dance, work out, meditate and so on.
- **A short line under each pet** saying what it's up to ("Taking a look.", "All done!"), plus a tag for the tool ("Reading…", "Editing…", "Bash").
- **Everyone's local time.** Each card shows the person's time and time zone, with a sun or moon, and an optional city. Handy when your team is spread across time zones.
- **Your own display name and city,** which you can change from your card or from Settings.
- **Room controls.** Rooms are invite-only. The person who made a room can remove people or delete the room. You can search the rooms you're already in.
- **Works on your phone.** Handy if you're away from your desk and just want to check what everyone's doing.

## How it works

```
your agent ──hook──▶ hook.mjs ──{event, tool} + your key──▶ /api/ingest
                                                             │ checks the key
                                                             │ turns the event into an activity
                                                             ▼
        everyone in the room sees it ◀──live update── your pet's row in the database
```

1. **The hook.** Claude Code and Codex can run a command whenever something happens (that's a *hook*). Mine is `public/hook.mjs`. It only keeps two things, the event name and the tool name, and sends them in the background so your agent never waits on it.
2. **The ingest route.** `POST /api/ingest` (`src/server/ingest-route.ts`) checks your key, turns away anything too big or broken, works out the activity (for example `PreToolUse` + `Edit` means editing, see `src/hook/activity.ts`) and saves it on your pet's row.
3. **Live updates.** The rows are stored in DeepSpace's database. When a row changes, DeepSpace sends the change to everyone allowed to see it, so the pets update without anyone refreshing.
4. **The pet.** `src/components/PetModel.tsx` shows the 3D pet and plays the animation for what your agent is doing. While the 3D model loads, the card shows the pet icon as a placeholder.

## DeepSpace features I used

| What the app needs | DeepSpace feature | Why |
|---|---|---|
| Know who you are | Sign-in | So only you can move your pet, and rooms can stay private |
| Pets update live | Records + `useQuery` | Changes get pushed to everyone watching, no refreshing |
| Only room members see a room | The `'team'` permission | The server checks it, so you can't get around it from the browser |
| One pet per person, nobody else can edit yours | `userBound`, `ownerField`, `uniqueOn`, `writableFields` | The server checks these on every save |
| Your display name and city | A `profiles` collection only you can read | Saved once and copied to every room you're in |
| Make a hook key, remove someone, delete a room | Server actions | They run on the server, check that you're allowed, then do the work |
| A public demo | Read-only `demo_pets` collection | Anyone can watch, only the server can change it |
| Cap request size | `readBoundedBodyText` | DeepSpace's own size-limited body reader |

**Things I built myself, and why:**
- **The hook and `/api/ingest`.** A hook script can't sign in like a browser does, and DeepSpace's own agent tokens need a DeepSpace account.
- **Hook keys.** Each person gets their own key, and the server only keeps a hash of it.
- **Joining by link.** DeepSpace doesn't have a built-in "join by code" feature.
- **The demo timer.** DeepSpace's scheduled jobs run at most once a minute, which is too slow for the demo to look alive.
- **The pet build script** (`scripts/build-pet.mjs`).

**Things I left out on purpose:**
- **An AI daily summary of each room.** I planned it, but it costs money per room and doesn't help with the main thing, which is seeing what everyone's doing right now.
- **A "who's watching" list.** The pets already show who's active.
- **Searching for other people's rooms.** It would let strangers see names, local times and what people's agents are doing. You can only search rooms you're already in.
- **Messaging, file uploads, live documents and payments.** They wouldn't add anything to this app.

## Privacy and security

- **The hook only sends the event name and the tool name.** Never file paths, commands, prompts or file contents. I tested this: I gave the hook a folder path and a `.env` path, and all it sent was `{"event":"PreToolUse","tool":"Read"}`.
- **Hook keys are long random strings, and you only see yours once.** The server only stores a *hash* of each key (a one-way fingerprint), in a table no user can read. Making a new key turns the old one off.
- **Room links use a random ID,** so nobody can guess them.
- **Removing someone or deleting a room also deletes their hook keys** for that room, so their agent stops sending updates there.
- **There are no secrets in this repo.** The app doesn't need any API keys.

## Tradeoffs and what's missing

- **You need to sign in to join a room.** DeepSpace gives signed-out visitors a new ID every time they connect, so guest rooms would have needed custom sign-in code everywhere. I made the public demo room instead, so anyone can still see how it works.
- **`/api/ingest` doesn't have a rate limit yet.** Requests are size-capped and need a valid key to change anything, but lots of bad requests would still each cost a database lookup. My next step would be Cloudflare's rate-limit feature.
- **Some animations get a bit cut off at the edge of the card,** like the done badge and the thought bubble. I decided to leave it and keep the build simple.
- **The pet file is 5.3 MB,** down from 12 MB. It only loads on pages that show pets.
- **Anyone can call the demo timer,** but it only moves the four demo pets, and the server ignores calls that come in less than 2.5 seconds after the last change.

## Run it yourself

```sh
npm install
npx deepspace dev start            # http://127.0.0.1:5173
npx tsc --noEmit && npx vitest run # type check and unit tests
npx deepspace test run             # smoke and API tests
npx deepspace test run e2e         # browser tests (the room tests need two test accounts)
```

If you change the pet model, rebuild it:

```sh
node scripts/build-pet.mjs path/to/lilagent.glb
```

The script keeps the 20 animations the app uses and adds the right face to each one. My desktop app picks the faces in code, so the web version needs them saved in the file. It also removes props those animations never use, which shrinks the file.

## Assets

Everything visual in this app is my own original work:

- **The 3D pet** is Lil Agent, a character I made for my Lil Agent desktop app, along with all its animations.
- **The logo, the landing page buttons and the pet icon** are my own designs. The original files (SVG and full-size PNG) are in `huddle-pets-branding/`, and the smaller copies the site actually uses are in `public/brand/`.

The only outside asset is the [Kanit](https://fonts.google.com/specimen/Kanit) font, which is free to use from Google Fonts. All the code was written for this project.
