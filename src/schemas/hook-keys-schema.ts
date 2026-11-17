import type { CollectionSchema } from 'deepspace/schema'

export const hookKeysSchema: CollectionSchema = {
  name: 'hook_keys',
  columns: [
    { name: 'teamId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'userId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'keyHash', storage: 'text', interpretation: 'plain', required: true },
  ],
  uniqueOn: ['teamId', 'userId'],
  permissions: {},
}
