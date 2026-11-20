import { expect, it } from 'vitest'
import { inviteMessage, isEmail } from './invite-email'

it.each(['ana@example.com', 'a.b+pets@team.co.uk'])('accepts %s', (email) => {
  expect(isEmail(email)).toBe(true)
})

it.each(['', 'ana', 'ana@', '@example.com', 'ana@example', 'ana @example.com', 'a<b>@example.com', 'ana@example.com\nbcc:x@y.com', `${'a'.repeat(250)}@x.com`])(
  'rejects %j',
  (email) => {
    expect(isEmail(email)).toBe(false)
  },
)

it('escapes names in the HTML and keeps the subject on one line', () => {
  const message = inviteMessage({ inviter: 'Dee <script>', room: 'Late\nnight "crew"', link: 'https://huddle-pets.app.space/r/abc' })
  expect(message.subject).toBe('Dee <script> invited you to Late night "crew" on huddle-pets')
  expect(message.html).toContain('Dee &lt;script&gt;')
  expect(message.html).toContain('Late night &quot;crew&quot;')
  expect(message.html).not.toContain('<script>')
  expect(message.text).toContain('Join the room: https://huddle-pets.app.space/r/abc')
})

it('falls back when names are empty', () => {
  expect(inviteMessage({ inviter: ' ', room: '', link: 'x' }).subject).toBe('A teammate invited you to a room on huddle-pets')
})
