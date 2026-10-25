import { describe, expect, it } from 'vitest'
import { findDrift, syncedFiles } from './sync-templates.mjs'

describe('bootstrap template alignment', () => {
  it('mirrors the canonical kit, host wiring, and verification scripts byte for byte', () => {
    expect(syncedFiles().length).toBeGreaterThan(20)
    expect(findDrift()).toEqual([])
  })
})
