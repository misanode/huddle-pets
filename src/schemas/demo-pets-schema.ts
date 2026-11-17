import type { CollectionSchema, RolePermissions } from 'deepspace/schema'
import { ACTIVITIES, type Member } from './team-members-schema'

export type DemoPet = Pick<Member, 'name' | 'activity' | 'tool'>

const readOnly: RolePermissions = { read: true, create: false, update: false, delete: false }

export const demoPetsSchema: CollectionSchema = {
  name: 'demo_pets',
  columns: [
    { name: 'name', storage: 'text', interpretation: 'plain', required: true },
    { name: 'activity', storage: 'text', interpretation: { kind: 'select', options: [...ACTIVITIES] }, default: 'idle' },
    { name: 'tool', storage: 'text', interpretation: 'plain', default: '' },
  ],
  uniqueOn: ['name'],
  permissions: { '*': readOnly, viewer: readOnly, member: readOnly, admin: readOnly },
}
