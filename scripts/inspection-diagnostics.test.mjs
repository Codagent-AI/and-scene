import { expect, test } from 'vitest'
import { attributionWarning, overlapWarnings, stylesAreIndistinct } from './inspection-diagnostics.mjs'

test('reports unmarked collisions but exempts intentional overlap', () => {
  const candidates = [
    { label: 'caption', rect: { left: 0, top: 0, right: 100, bottom: 20 } },
    { label: 'title', rect: { left: 50, top: 0, right: 150, bottom: 20 } },
    { label: 'intentional', allowed: true, rect: { left: 55, top: 0, right: 160, bottom: 20 } },
  ]
  expect(overlapWarnings(candidates, 3)).toEqual(['inspect: advisory step 3: caption overlaps title; mark only intentional readable compositions with data-presentation-allow-overlap'])
})

test('detects indistinct active chrome and unpolished attribution', () => {
  expect(stylesAreIndistinct({ color: 'rgb(1, 1, 1)', backgroundColor: 'transparent', borderColor: 'rgb(2, 2, 2)' }, { color: 'rgb(1, 1, 1)', backgroundColor: 'transparent', borderColor: 'rgb(2, 2, 2)' })).toBe(true)
  expect(attributionWarning({ fontSize: 9, color: 'rgb(0, 0, 238)' })).toContain('attribution')
  expect(attributionWarning(null)).toContain('missing')
})
