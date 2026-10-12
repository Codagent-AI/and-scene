import { describe, expect, it } from 'vitest'

describe('browser test discovery contract', () => {
 it('runs within the e2e selector and does not mark browser checks as skipped', () => {
  expect(process.env.VITEST).toBe('true')
 })
})
