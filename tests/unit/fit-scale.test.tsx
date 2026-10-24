import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  Stage,
  computeFitScale,
  stageInsets,
} from '../../src/presentation-kit'
import { makeSteps, setViewport } from './helpers'

describe('fit scale', () => {
  it('defines the default 880 × 380 canvas and per-mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) {
      expect(STAGE_LAYOUT[mode]).toEqual(expect.objectContaining({ top: expect.any(Number), bottom: expect.any(Number), side: expect.any(Number) }))
    }
    expect(STAGE_LAYOUT.browse.bottom).toBeGreaterThan(STAGE_LAYOUT.present.bottom)
  })

  it('uses the smaller of the width and height ratios', () => {
    const { side, top, bottom } = STAGE_LAYOUT.present
    const wideShort = computeFitScale({ width: 5000, height: top + bottom + 380 }, 'present')
    expect(wideShort).toBeCloseTo(1)
    const narrowTall = computeFitScale({ width: 2 * side + 440, height: 5000 }, 'present')
    expect(narrowTall).toBeCloseTo(0.5)
  })

  it('never goes below MIN_SCALE', () => {
    expect(computeFitScale({ width: 50, height: 50 }, 'browse')).toBe(MIN_SCALE)
  })

  it('computes a different geometry per mode', () => {
    const vp = { width: 1440, height: 900 }
    expect(computeFitScale(vp, 'present')).toBeGreaterThan(computeFitScale(vp, 'browse'))
  })

  it('reserves room for the table of contents only in wide browse mode', () => {
    expect(stageInsets('browse', 1024).left).toBe(STAGE_LAYOUT.browse.side + STAGE_LAYOUT.browse.tocWidth)
    expect(stageInsets('browse', 1023).left).toBe(STAGE_LAYOUT.browse.side)
    expect(stageInsets('present', 2000).left).toBe(STAGE_LAYOUT.present.side)
  })

  describe('Stage', () => {
    const [a, b] = makeSteps(2)
    const canvas = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-canvas]')!

    it('renders the fixed 880 × 380 canvas by default and honours an override', () => {
      setViewport(1440, 900)
      const { container, rerender } = render(<Stage step={a} index={0} mode="present" />)
      expect(canvas(container).style.width).toBe('880px')
      expect(canvas(container).style.height).toBe('380px')
      rerender(<Stage step={a} index={0} mode="present" canvas={{ width: 400, height: 200 }} />)
      expect(canvas(container).style.width).toBe('400px')
      expect(canvas(container).style.height).toBe('200px')
    })

    it('applies one uniform scale that is identical on every step at a fixed viewport and mode', () => {
      setViewport(1440, 900)
      const { container, rerender } = render(<Stage step={a} index={0} mode="browse" />)
      const first = canvas(container).getAttribute('data-presentation-scale')
      rerender(<Stage step={b} index={1} mode="browse" />)
      expect(canvas(container).getAttribute('data-presentation-scale')).toBe(first)
      expect(Number(first)).toBeCloseTo(computeFitScale({ width: 1440, height: 900 }, 'browse'))
      expect(canvas(container).style.width).toBe('880px')
    })

    it('recomputes the scale on resize and on mode change, keeping the canvas size', () => {
      setViewport(1440, 900)
      const { container, rerender } = render(<Stage step={a} index={0} mode="browse" />)
      const scale = () => Number(canvas(container).getAttribute('data-presentation-scale'))
      const wide = scale()
      act(() => setViewport(700, 900))
      expect(scale()).toBeCloseTo(computeFitScale({ width: 700, height: 900 }, 'browse'))
      expect(scale()).toBeLessThan(wide)
      rerender(<Stage step={a} index={0} mode="present" />)
      expect(scale()).toBeCloseTo(computeFitScale({ width: 700, height: 900 }, 'present'))
      expect(canvas(container).style.width).toBe('880px')
      expect(canvas(container).style.height).toBe('380px')
    })
  })
})
