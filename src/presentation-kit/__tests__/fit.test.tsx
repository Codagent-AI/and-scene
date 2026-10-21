import { act, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, ENTER_DELAY, LAYOUT_T } from '../constants'
import { availableSpace, computeFitScale } from '../fitScale'
import { Presentation } from '../Presentation'
import { Stage } from '../Stage'
import { useFitScale } from '../useFitScale'
import { makeSteps, setViewport } from './fixtures'

describe('constants', () => {
  it('defaults the canvas to 880 x 380 with browse and present geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(MIN_SCALE).toBeGreaterThan(0)
    for (const mode of ['browse', 'present'] as const) {
      const g = STAGE_LAYOUT[mode]
      expect(g.top).toBeGreaterThanOrEqual(0)
      expect(g.bottom).toBeGreaterThan(0)
      expect(g.side).toBeGreaterThanOrEqual(0)
    }
    expect(STAGE_LAYOUT.browse).not.toEqual(STAGE_LAYOUT.present)
  })

  it('newcomers wait at least as long as the layout morph', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})

describe('computeFitScale', () => {
  const expected = (mode: 'browse' | 'present', w: number, h: number) => {
    const s = availableSpace(mode, { width: w, height: h })
    return Math.max(MIN_SCALE, Math.min(s.width / DESIGN_W, s.height / DESIGN_H))
  }

  it.each([
    ['browse', 1440, 900],
    ['present', 1440, 900],
    ['browse', 600, 2000],
    ['present', 3000, 700],
    ['browse', 50, 50],
    ['present', 5000, 4000],
  ] as const)('%s at %ix%i matches min(width, height) with the floor', (mode, w, h) => {
    expect(computeFitScale(mode, { width: w, height: h })).toBeCloseTo(expected(mode, w, h), 10)
  })

  it('is width-limited, height-limited, floored, and uncapped', () => {
    const wide = computeFitScale('present', { width: 400, height: 4000 })
    expect(wide).toBeCloseTo((400 - 2 * STAGE_LAYOUT.present.side) / DESIGN_W, 10)
    const tall = computeFitScale('present', { width: 5000, height: 500 })
    expect(tall).toBeCloseTo((500 - STAGE_LAYOUT.present.top - STAGE_LAYOUT.present.bottom) / DESIGN_H, 10)
    expect(computeFitScale('browse', { width: 10, height: 10 })).toBe(MIN_SCALE)
    expect(computeFitScale('present', { width: 8000, height: 8000 })).toBeGreaterThan(5)
  })

  it('differs between modes for the same viewport', () => {
    const v = { width: 1440, height: 900 }
    expect(computeFitScale('browse', v)).toBeLessThan(computeFitScale('present', v))
  })
})

describe('useFitScale', () => {
  it('recomputes on resize and mode change', () => {
    setViewport(1440, 900)
    const { result, rerender } = renderHook(({ mode }) => useFitScale(mode), { initialProps: { mode: 'browse' as const } as { mode: 'browse' | 'present' } })
    const first = result.current
    expect(first).toBeCloseTo(computeFitScale('browse', { width: 1440, height: 900 }), 10)
    act(() => setViewport(800, 900))
    expect(result.current).toBeCloseTo(computeFitScale('browse', { width: 800, height: 900 }), 10)
    act(() => setViewport(1440, 900))
    rerender({ mode: 'present' })
    expect(result.current).toBeCloseTo(computeFitScale('present', { width: 1440, height: 900 }), 10)
  })
})

describe('Stage', () => {
  it('renders the fixed 880x380 design canvas under one uniform scale', () => {
    const [step] = makeSteps(1)
    const { container } = render(<Stage step={step} stepIndex={0} mode="browse" scale={0.5} />)
    const design = container.querySelector('[data-presentation-design]') as HTMLElement
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([design.style.width, design.style.height]).toEqual(['880px', '380px'])
    expect(design.style.transform).toBe('scale(0.5)')
    expect([canvas.style.width, canvas.style.height]).toEqual(['440px', '190px'])
  })

  it('uses the same scale for every step at a fixed viewport and mode, and recomputes only from viewport/mode', () => {
    setViewport(1200, 800)
    const steps = makeSteps(3)
    steps[1].payload = { label: 'a much longer payload '.repeat(20) }
    render(<Presentation steps={steps} title="Deck" />)
    const scale = () => document.querySelector('[data-presentation-canvas]')!.getAttribute('data-presentation-scale')
    const seen = new Set<string | null>()
    for (let i = 0; i < 3; i++) {
      seen.add(scale())
      act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })))
    }
    expect(seen.size).toBe(1)
    const before = scale()
    act(() => setViewport(700, 800))
    expect(scale()).not.toBe(before)
    expect(Number(scale())).toBeCloseTo(computeFitScale('browse', { width: 700, height: 800 }), 10)
    const design = document.querySelector('[data-presentation-design]') as HTMLElement
    expect([design.style.width, design.style.height]).toEqual(['880px', '380px'])
  })

  it('does not animate the outer fit transform', () => {
    const [step] = makeSteps(1)
    const { container } = render(<Stage step={step} stepIndex={0} mode="browse" scale={1} />)
    const design = container.querySelector('[data-presentation-design]') as HTMLElement
    expect(design.style.transition).toBe('')
    expect(design.hasAttribute('data-projection-id')).toBe(false)
  })
})
