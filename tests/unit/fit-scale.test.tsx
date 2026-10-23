// @vitest-environment jsdom
import { act, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DESIGN_H, DESIGN_W, MIN_SCALE, Presentation, STAGE_LAYOUT, Stage, fitScale, useFitScale,
} from '../../src/presentation-kit'
import { key, makeSteps, setViewport } from './helpers/fixtures'

afterEach(() => setViewport(1024, 800))

const canvas = () => document.querySelector<HTMLElement>('[data-presentation-canvas]')!
const scaleOf = () => Number(/scale\(([\d.]+)\)/.exec(canvas().style.transform)?.[1])

describe('canvas dimensions', () => {
  it('defaults to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    render(<Stage step={makeSteps(['a'])[0]} mode="browse" />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
  })

  it('accepts an override that reaches the fit calculation', () => {
    setViewport(1200, 900)
    render(<Stage step={makeSteps(['a'])[0]} mode="browse" canvas={{ width: 400, height: 400 }} />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['400px', '400px'])
    expect(scaleOf()).toBeCloseTo(fitScale({ width: 1200, height: 900 }, 'browse', { width: 400, height: 400 }))
    expect(scaleOf()).not.toBeCloseTo(fitScale({ width: 1200, height: 900 }, 'browse'))
  })
})

describe('fitScale', () => {
  const { top, bottom, side } = STAGE_LAYOUT.browse
  it('is width-limited, height-limited or clamped at the minimum', () => {
    const wide = { width: 880 + side * 2, height: 5000 }
    expect(fitScale(wide, 'browse')).toBeCloseTo(1)
    const tall = { width: 5000, height: DESIGN_H + top + bottom }
    expect(fitScale(tall, 'browse')).toBeCloseTo(1)
    expect(fitScale({ width: 2 * 880 + 2 * side, height: 5000 }, 'browse')).toBeCloseTo(2)
    expect(fitScale({ width: 10, height: 10 }, 'browse')).toBe(MIN_SCALE)
    expect(fitScale({ width: 10, height: 10 }, 'present')).toBe(MIN_SCALE)
  })

  it('uses the active mode geometry', () => {
    const vp = { width: 5000, height: 800 }
    expect(fitScale(vp, 'present')).toBeCloseTo((800 - STAGE_LAYOUT.present.top - STAGE_LAYOUT.present.bottom) / DESIGN_H)
    expect(fitScale(vp, 'present')).toBeGreaterThan(fitScale(vp, 'browse'))
  })
})

describe('useFitScale', () => {
  it('recomputes on viewport resize, mode change and canvas override', () => {
    setViewport(1200, 900)
    const { result, rerender } = renderHook(({ mode, c }) => useFitScale(mode, c), {
      initialProps: { mode: 'browse' as const, c: undefined as { width: number; height: number } | undefined },
    })
    const initial = result.current
    expect(initial).toBeCloseTo(fitScale({ width: 1200, height: 900 }, 'browse'))
    act(() => setViewport(700, 900))
    expect(result.current).toBeCloseTo(fitScale({ width: 700, height: 900 }, 'browse'))
    expect(result.current).toBeLessThan(initial)
    rerender({ mode: 'browse', c: { width: 440, height: 190 } })
    expect(result.current).toBeCloseTo(fitScale({ width: 700, height: 900 }, 'browse', { width: 440, height: 190 }))
  })
})

describe('stage scaling in a presentation', () => {
  it('uses one uniform scale that navigation never changes, but resize does', () => {
    setViewport(1300, 800)
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" />)
    expect(canvas().style.transform).toMatch(/^scale\([\d.]+\)$/) // equal-axis, single transform
    const initial = scaleOf()
    for (let i = 0; i < 2; i++) {
      act(() => void key('ArrowRight'))
      expect(scaleOf()).toBe(initial)
    }
    act(() => setViewport(600, 800))
    expect(scaleOf()).toBeLessThan(initial)
    act(() => void key('p'))
    expect(scaleOf()).toBeCloseTo(fitScale({ width: 600, height: 800 }, 'present'))
  })

  it('leaves the internal composition untouched when scaling', () => {
    render(<Presentation steps={makeSteps(['a'], () => <div data-testid="inner" style={{ position: 'absolute', left: 7 }} />)} title="Deck" />)
    const inner = document.querySelector<HTMLElement>('[data-testid="inner"]')!
    setViewport(500, 700)
    expect(inner.style.left).toBe('7px')
    expect(inner.style.transform).toBe('')
  })
})
