/**
 * Landing page — a STATIC page.
 *
 * It lives at the top level of src/pages/ (not under (app)/), so it renders
 * with no DeepSpace providers: no auth session fetch, no records WebSocket.
 * That makes it cheap to serve and safe for logged-out / crawler traffic.
 *
 * Need live data or auth here? Move this file to src/pages/(app)/index.tsx
 * and it becomes a dynamic page. Conversely, any page you want to keep static
 * (marketing, docs, legal) belongs at this top level.
 *
 * Top-level pages are also prerendered to static HTML at build
 * (prerender.ts, via vite.config.ts) so crawlers read real content.
 * Keep them renderable without a browser: no window/document during render,
 * prose in HTML text, reveal animations in CSS keyframes rather than JS-driven
 * initial states. `<Seo>` comes first and reads src/seo.ts.
 */

import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { APP_NAME } from '../constants'
import { seo } from '../seo'

const brandButton =
  'relative grid place-items-center rounded-2xl transition duration-150 hover:brightness-125 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>*]:col-start-1 [&>*]:row-start-1'
const brandLabel = 'select-none whitespace-nowrap pb-0.5 text-lg font-semibold text-white sm:text-[22px]'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div
        data-testid="static-landing"
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <img src="/brand/logo.png" alt={APP_NAME} width={540} height={516} className="mb-2 h-auto w-36 sm:w-44" />
        <h1 className="mb-4 max-w-2xl text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
          See what your team’s coding agents are doing
        </h1>
        <p className="mb-8 max-w-md text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
          Each teammate gets a pet that reacts live to their Claude Code or Codex sessions: reading, editing, running commands, or
          waiting for them.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to="/demo" className={brandButton}>
            <img src="/brand/watch-live-demo.png" alt="" width={780} height={230} className="h-16 w-auto sm:h-[76px]" />
            <span className={brandLabel}>Watch the live demo</span>
          </Link>
          <Link to="/home" className={brandButton}>
            <img src="/brand/create-a-room.png" alt="" width={660} height={230} className="h-16 w-auto sm:h-[76px]" />
            <span className={brandLabel}>Create a room</span>
          </Link>
        </div>
      </div>
    </>
  )
}
