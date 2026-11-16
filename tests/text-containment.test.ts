import { describe, expect, it } from 'vitest'
import { textContainment } from './helpers/text-containment.mjs'
const canvas = { left: 0, right: 880, top: 0, bottom: 1280 }
const owner = { left: 100, right: 200, top: 100, bottom: 300 }
describe('R4 uniform entity containment', () => {
  it.each([['verify', 160, 360], ['kit', 420, 200], ['ghost', 48, 295], ['step-card', 130, 295], ['question', 350, 100]] as const)('rejects %s text spilling outside its owner even when it fits the canvas', (_name, width, height) => {
    const entity = { left: 100, right: 100 + width, top: 100, bottom: 100 + height }
    const spill = { left: 110, right: entity.right + 10, top: 110, bottom: Math.min(entity.bottom, 180) }
    expect(textContainment(spill, entity, canvas)).toEqual({ fitsCanvas: true, fitsOwner: false })
  })
  it.each([
    { left: 98, right: 150, top: 110, bottom: 200 },
    { left: 110, right: 202, top: 110, bottom: 200 },
    { left: 110, right: 150, top: 98, bottom: 200 },
    { left: 110, right: 150, top: 110, bottom: 302 },
  ])('checks every owner edge: %j', text => { expect(textContainment(text, owner, canvas).fitsOwner).toBe(false) })
  it('accepts contained labels and the one-pixel rounding tolerance', () => {
    expect(textContainment({ left: 99, right: 201, top: 99, bottom: 301 }, owner, canvas)).toEqual({ fitsCanvas: true, fitsOwner: true })
  })
  it('permits explicit readable owner overlap while still rejecting text outside the canvas', () => {
    expect(textContainment({ left: 110, right: 220, top: 110, bottom: 200 }, owner, canvas, true)).toEqual({ fitsCanvas: true, fitsOwner: true })
    expect(textContainment({ left: 110, right: 900, top: 110, bottom: 200 }, owner, canvas, true)).toEqual({ fitsCanvas: false, fitsOwner: true })
  })
})
