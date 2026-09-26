import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { referenceOutline } from '../scripts/reference-sample-outline.mjs'

const root = resolve(import.meta.dirname, '..')
const sample = 'src/presentations/how-to-make-a-presentation'

describe('reference sample', () => {
  it('exists and is registered as the canonical nine-step presentation', () => {
    expect(existsSync(resolve(root, sample, 'Talk.tsx'))).toBe(true)
    const registry = readFileSync(resolve(root, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'how-to-make-a-presentation'")
    const steps = readFileSync(resolve(root, sample, 'steps/index.ts'), 'utf8')
    for (const [title, caption] of referenceOutline) {
      expect(steps).toContain(title)
      expect(steps).toContain(caption)
    }
    expect((steps.match(/id: '/g) ?? []).length).toBe(referenceOutline.length)
    expect(steps).toContain('groupKey:')
  })
})
