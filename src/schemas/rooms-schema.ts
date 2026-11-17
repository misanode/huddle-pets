import type { CollectionSchema, RolePermissions } from 'deepspace/schema'

const access: RolePermissions = { read: 'team', create: true, update: 'own', delete: 'own' }

export const roomsSchema: CollectionSchema = {
  name: 'rooms',
  columns: [
    { name: 'teamId', storage: 'text', interpretation: 'plain', required: true, immutable: true, maxLength: 64 },
    { name: 'name', storage: 'text', interpretation: 'plain', required: true, maxLength: 60 },
  ],
  teamField: 'teamId',
  uniqueOn: ['teamId'],
  permissions: { member: access, admin: access },
}

export type Room = { teamId: string; name: string }
