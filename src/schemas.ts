/**
 * Collection Schemas
 *
 * All collections with columns and RBAC permissions.
 * Single source of truth — imported by both worker and frontend.
 *
 * Add schemas by creating a file in src/schemas/ and importing it here.
 */

import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema'
import { settingsSchema } from './schemas/admin-schema'
import { roomsSchema } from './schemas/rooms-schema'
import { teamMembersSchema } from './schemas/team-members-schema'
import { hookKeysSchema } from './schemas/hook-keys-schema'
import { emailInvitesSchema } from './schemas/email-invites-schema'
import { demoPetsSchema } from './schemas/demo-pets-schema'
import { profilesSchema } from './schemas/profiles-schema'

export const schemas: CollectionSchema[] = [
  usersSchema,
  profilesSchema,
  settingsSchema,
  roomsSchema,
  teamMembersSchema,
  hookKeysSchema,
  emailInvitesSchema,
  demoPetsSchema,
]
