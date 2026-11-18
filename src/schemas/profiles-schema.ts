import type { CollectionSchema, RolePermissions } from 'deepspace/schema'

export const DISPLAY_NAME_MAX = 40

const access: RolePermissions = { read: 'own', create: true, update: 'own', delete: 'own', writableFields: ['displayName'] }

export const profilesSchema: CollectionSchema = {
  name: 'profiles',
  columns: [
    { name: 'userId', storage: 'text', interpretation: 'plain', userBound: true, immutable: true, required: true },
    { name: 'displayName', storage: 'text', interpretation: 'plain', required: true, maxLength: DISPLAY_NAME_MAX },
  ],
  ownerField: 'userId',
  uniqueOn: ['userId'],
  permissions: { member: access, admin: access },
}

export type Profile = { userId?: string; displayName: string }
