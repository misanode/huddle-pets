import type { CollectionSchema, RolePermissions } from 'deepspace/schema'

export const ACTIVITIES = ['idle', 'thinking', 'reading', 'searching', 'editing', 'command', 'waiting', 'permission', 'error'] as const
export type Activity = (typeof ACTIVITIES)[number]

const access: RolePermissions = {
  read: 'team',
  create: true,
  update: 'own',
  delete: 'own',
  writableFields: ['teamId', 'name', 'activity', 'tool'],
}

export const teamMembersSchema: CollectionSchema = {
  name: 'team_members',
  columns: [
    { name: 'teamId', storage: 'text', interpretation: 'plain', required: true, immutable: true, maxLength: 64 },
    { name: 'userId', storage: 'text', interpretation: 'plain', userBound: true, immutable: true },
    { name: 'status', storage: 'text', interpretation: 'plain', default: 'active' },
    { name: 'name', storage: 'text', interpretation: 'plain', required: true, maxLength: 40 },
    { name: 'activity', storage: 'text', interpretation: { kind: 'select', options: [...ACTIVITIES] }, default: 'idle' },
    { name: 'tool', storage: 'text', interpretation: 'plain', default: '', maxLength: 64 },
  ],
  teamField: 'teamId',
  ownerField: 'userId',
  uniqueOn: ['teamId', 'userId'],
  permissions: { member: access, admin: access },
}

export type Member = { teamId: string; userId?: string; status?: 'active' | 'removed'; name: string; activity: Activity; tool: string }
