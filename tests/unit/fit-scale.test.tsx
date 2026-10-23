import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  computeFitScale, DESIGN_H, DESIGN_W, MIN_SCALE, Presentation, STAGE_LAYOUT, stageInsets,
} from '../../src/presentation-kit'
import { FOUR, setViewport } from '../helpers/fixtures'

const canvas = () => document.querySelector('[data-presentation-canvas]') as HTMLElement
const scaleOf = () => Number(/scale\(([^)]+)\)/.exec(canvas().style.transform)![1])

beforeEach(() => setViewport(1440, 900))

describe('default canvas', () => {
  it('is 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    render(<Presentation steps={FOUR} title="t" />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
  })

  it('honours an overridden canvas for both geometry and fit math', () => {
    render(<Presentation steps={FOUR} title="t" designWidth={400} designHeight={200} />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['400px', '200px'])
    const expected = computeFitScale({ viewportWidth: 1440, viewportHeight: 900, mode: 'browse', designWidth: 400, designHeight: 200 })
    expect(scaleOf()).toBeCloseTo(expected, 5)
    expect(expected).not.toBeCloseTo(computeFitScale({ viewportWidth: 1440, viewportHeight: 900, mode: 'browse' }), 3)
  })
})

describe('fit math', () => {
  it('uses one uniform factor limited by the tighter axis', () => {
    const { top, bottom, side } = stageInsets('browse', 1440)
    const w = (1440 - 2 * side) / DESIGN_W
    const h = (900 - top - bottom) / DESIGN_H
    expect(computeFitScale({ viewportWidth: 1440, viewportHeight: 900, mode: 'browse' })).toBeCloseTo(Math.min(w, h), 10)
    // a very wide viewport is height-limited
    expect(computeFitScale({ viewportWidth: 4000, viewportHeight: 700, mode: 'browse' })).toBeCloseTo((700 - top - bottom) / DESIGN_H, 10)
  })

  it('never drops below MIN_SCALE', () => {
    expect(computeFitScale({ viewportWidth: 50, viewportHeight: 50, mode: 'present' })).toBe(MIN_SCALE)
  })

  it('uses each mode\'s stage geometry (table of contents widens the browse side inset)', () => {
    expect(stageInsets('browse', 1440)).toEqual({ top: STAGE_LAYOUT.browse.top, bottom: STAGE_LAYOUT.browse.bottom, side: STAGE_LAYOUT.browse.tocSide })
    expect(stageInsets('browse', 600).side).toBe(STAGE_LAYOUT.browse.side)
    expect(stageInsets('present', 1440)).toEqual({ top: STAGE_LAYOUT.present.top, bottom: STAGE_LAYOUT.present.bottom, side: STAGE_LAYOUT.present.side })
    const browse = computeFitScale({ viewportWidth: 1440, viewportHeight: 900, mode: 'browse' })
    const present = computeFitScale({ viewportWidth: 1440, viewportHeight: 900, mode: 'present' })
    expect(present).toBeGreaterThan(browse)
  })
})

describe('scaled stage', () => {
  it('keeps the scale identical for every step at a fixed viewport and mode', () => {
    render(<Presentation steps={FOUR} title="t" />)
    const first = scaleOf()
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(scaleOf()).toBe(first)
    }
  })

  it('recomputes uniformly on resize without changing the internal canvas', () => {
    render(<Presentation steps={FOUR} title="t" />)
    const before = scaleOf()
    act(() => setViewport(1000, 700))
    const after = scaleOf()
    expect(after).not.toBe(before)
    expect(after).toBeCloseTo(computeFitScale({ viewportWidth: 1000, viewportHeight: 700, mode: 'browse' }), 10)
    expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
    expect(canvas().style.transform).toBe(`scale(${after})`) // a single uniform factor
  })

  it('recomputes from the new mode geometry on mode change', () => {
    render(<Presentation steps={FOUR} title="t" />)
    const browse = scaleOf()
    fireEvent.keyDown(window, { key: 'p' })
    expect(scaleOf()).toBeCloseTo(computeFitScale({ viewportWidth: 1440, viewportHeight: 900, mode: 'present' }), 10)
    expect(scaleOf()).not.toBe(browse)
  })
})
