// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  ENTER_T,
  LAYOUT_T,
  MIN_SCALE,
  STAGE_LAYOUT,
  SWIPE_MIN_PX,
  activeEraIndex,
  clampIndex,
  computeFitScale,
  eraSections,
  isInteractiveTarget,
  stepNumber,
  swipeDirection,
} from '../../src/presentation-kit/index.ts'

describe('canvas and timing constants', () => {
  it('defaults to an 880 x 380 design canvas with per-mode fit geometry (M-26)', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(STAGE_LAYOUT.browse).toBeDefined()
    expect(STAGE_LAYOUT.present).toBeDefined()
    expect(STAGE_LAYOUT.browse).not.toEqual(STAGE_LAYOUT.present)
  })

  it('makes newcomers wait at least as long as the layout morph (M-05)', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
  })
})

describe('numbering and eras (M-02, M-22)', () => {
  it('derives the displayed number from position only', () => {
    expect([0, 1, 8].map(stepNumber)).toEqual([1, 2, 9])
  })

  it('groups consecutive steps of an era and finds the first index', () => {
    const steps = ['a', 'a', 'b', 'b', 'b', 'c', 'a'].map((era) => ({ era }))
    const eras = eraSections(steps)
    expect(eras.map((e) => [e.label, e.firstIndex, e.indices.length])).toEqual([
      ['a', 0, 2],
      ['b', 2, 3],
      ['c', 5, 1],
      ['a', 6, 1],
    ])
    expect(activeEraIndex(eras, 4)).toBe(1)
    expect(activeEraIndex(eras, 6)).toBe(3)
  })

  it('clamps indices at both ends, including a single-step deck', () => {
    expect([clampIndex(-3, 5), clampIndex(2, 5), clampIndex(9, 5), clampIndex(4, 1), clampIndex(0, 0)]).toEqual([0, 2, 4, 0, 0])
  })
})

describe('computeFitScale (M-27)', () => {
  it('uses the smaller of the width and height ratios after the mode insets', () => {
    const { insetX, insetY } = STAGE_LAYOUT.browse
    expect(computeFitScale(1760 + 2 * insetX, 3000, 'browse')).toBeCloseTo(2)
    expect(computeFitScale(5000, 190 + 2 * insetY, 'browse')).toBeCloseTo(0.5)
  })

  it('scales width and height independently and respects the mode', () => {
    const a = computeFitScale(1200, 700, 'browse')
    const b = computeFitScale(1200, 700, 'present')
    expect(b).toBeLessThan(a)
    expect(computeFitScale(1200, 700, 'browse', 440, 190)).toBeGreaterThan(a)
  })

  it('never drops below MIN_SCALE', () => {
    expect(computeFitScale(0, 0, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(10, 10, 'present')).toBe(MIN_SCALE)
  })
})

describe('swipeDirection (M-21)', () => {
  it('maps left swipes to next and right swipes to previous', () => {
    expect(swipeDirection(-SWIPE_MIN_PX, 0)).toBe(1)
    expect(swipeDirection(SWIPE_MIN_PX, 4)).toBe(-1)
  })

  it('ignores tiny, just-below-threshold and vertical-dominant gestures', () => {
    expect(swipeDirection(-5, 0)).toBe(0)
    expect(swipeDirection(-(SWIPE_MIN_PX - 1), 0)).toBe(0)
    expect(swipeDirection(-80, 120)).toBe(0)
    expect(swipeDirection(-80, 80)).toBe(0)
  })
})

describe('isInteractiveTarget (M-24)', () => {
  it('recognises controls and their descendants but not plain content', () => {
    document.body.innerHTML = `
      <button id="b"><span id="in">x</span></button><a href="/x" id="a">l</a>
      <input id="i"><select id="s"></select><textarea id="t"></textarea>
      <div contenteditable="true" id="e"><b id="eb">q</b></div>
      <div role="button" id="r"></div><a id="plain">no href</a><p id="p">text</p>`
    const el = (id: string) => document.getElementById(id)
    for (const id of ['b', 'in', 'a', 'i', 's', 't', 'e', 'eb', 'r']) expect(isInteractiveTarget(el(id)), id).toBe(true)
    for (const id of ['plain', 'p']) expect(isInteractiveTarget(el(id)), id).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
})
