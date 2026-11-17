import { expect, it } from 'vitest'
import { lintSchemas } from 'deepspace/worker'
import { schemas } from './schemas'

it('schemas pass the SDK schema lint', () => {
  expect(lintSchemas(schemas)).toEqual([])
})
