import type { CollectionSchema } from 'deepspace/schema'

export const emailInvitesSchema: CollectionSchema = {
  name: 'email_invites',
  columns: [
    { name: 'teamId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'userId', storage: 'text', interpretation: 'plain', required: true },
  ],
  permissions: {},
}

export type EmailInvite = { teamId: string; userId: string }
