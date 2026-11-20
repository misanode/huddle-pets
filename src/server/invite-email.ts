export const INVITES_PER_DAY = 10

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

export const isEmail = (value: string) => value.length <= 254 && EMAIL_PATTERN.test(value)

const oneLine = (value: string) => value.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ').trim()

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

export function inviteMessage({ inviter, room, link }: { inviter: string; room: string; link: string }) {
  const who = oneLine(inviter) || 'A teammate'
  const where = oneLine(room) || 'a room'
  return {
    subject: `${who} invited you to ${where} on huddle-pets`,
    text: `${who} invited you to the room "${where}" on huddle-pets, where everyone's coding agent shows up as a live pet.\n\nJoin the room: ${link}\n\nYou'll need to sign in first. If you weren't expecting this, you can ignore this email.`,
    html: `<p>${escapeHtml(who)} invited you to the room <strong>${escapeHtml(where)}</strong> on huddle-pets, where everyone's coding agent shows up as a live pet.</p><p><a href="${escapeHtml(link)}">Join the room</a></p><p style="color:#666">You'll need to sign in first. If you weren't expecting this, you can ignore this email.</p>`,
  }
}
