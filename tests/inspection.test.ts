// @vitest-environment node
import { it, expect } from 'vitest'
import { inspect } from '../scripts/inspect-presentation.mjs'
it('I-49 invalid settle intervals are rejected before any browser or build starts', async () => {
  for (const settle of [-1, NaN, Infinity]) await expect(inspect({ slug: 'registered-example', settle })).rejects.toThrow('settle interval must be non-negative')
  await expect(inspect({ slug: '../outside-project' })).rejects.toThrow('registered presentation slug')
})
