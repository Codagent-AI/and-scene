import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findDrift } from '../../../scripts/sync-templates.mjs'

const root = path.resolve(import.meta.dirname, '../../..')

describe('bootstrap template drift guard', () => {
  it('keeps the kit and scaffolded scripts aligned with the canonical copies (run `npm run sync:templates` to fix)', () => {
    expect(findDrift(root)).toEqual([])
  })
})
