import { describe, expect, it } from 'vitest'
import { presentations } from '../../src/presentations'

describe('integration test discovery', () => {
 it('uses the explicit presentation registry as the host integration point', () => {
  expect(Array.isArray(presentations)).toBe(true)
 })
})
