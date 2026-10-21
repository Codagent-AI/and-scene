import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_CANVAS, DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, TOC_WIDTH, WIDE_BREAKPOINT,
} from './constants'
import { computeFit, useFitScale } from './useFitScale'

describe('constants', () => {
  it('defaults the design canvas to 880 x 380 with per-mode geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(DEFAULT_CANVAS).toEqual({ width: 880, height: 380 })
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })
})

describe('computeFit', () => {
  const insets = STAGE_LAYOUT.browse

  it('is limited by width when the stage is wide and short', () => {
    const fit = computeFit({ width: 600, height: 2000 }, 'browse', false)
    expect(fit.scale).toBeCloseTo((600 - insets.left - insets.right) / 880)
  })

  it('is limited by height when the stage is tall and narrow', () => {
    const fit = computeFit({ width: 4000, height: 700 }, 'browse', false)
    expect(fit.scale).toBeCloseTo((700 - insets.top - insets.bottom) / 380)
  })

  it('never drops below the minimum scale', () => {
    expect(computeFit({ width: 50, height: 50 }, 'browse', false).scale).toBe(MIN_SCALE)
  })

  it('uses per-mode geometry', () => {
    const viewport = { width: 4000, height: 700 }
    const present = computeFit(viewport, 'present', false)
    const browse = computeFit(viewport, 'browse', false)
    expect(present.scale).toBeCloseTo((700 - STAGE_LAYOUT.present.top - STAGE_LAYOUT.present.bottom) / 380)
    expect(present.scale).toBeGreaterThan(browse.scale)
  })

  it('reserves room for the table of contents', () => {
    const viewport = { width: 1100, height: 4000 }
    const without = computeFit(viewport, 'browse', false)
    const withToc = computeFit(viewport, 'browse', true)
    expect(withToc.region.left).toBe(TOC_WIDTH)
    expect(withToc.scale).toBeCloseTo((1100 - TOC_WIDTH) / 880)
    expect(withToc.scale).toBeLessThan(without.scale)
  })

  it('recomputes the scale from a supplied canvas', () => {
    const viewport = { width: 1000, height: 4000 }
    const small = computeFit(viewport, 'present', false, { width: 400, height: 200 })
    expect(small.scale).toBeCloseTo(1000 / 400)
    expect(small.scale).not.toBe(computeFit(viewport, 'present', false).scale)
  })
})

describe('useFitScale', () => {
  const original = { w: window.innerWidth, h: window.innerHeight }
  afterEach(() => resize(original.w, original.h))

  function resize(width: number, height: number) {
    act(() => {
      Object.assign(window, { innerWidth: width, innerHeight: height })
      window.dispatchEvent(new Event('resize'))
    })
  }

  it('recomputes on resize and on mode change, and reports the wide breakpoint', () => {
    resize(1400, 900)
    const { result, rerender } = renderHook((p: { mode: 'browse' | 'present' }) => useFitScale(p.mode), {
      initialProps: { mode: 'browse' as const },
    })
    const wideScale = result.current.scale
    expect(result.current.wide).toBe(true)
    expect(result.current.tocVisible).toBe(true)

    resize(WIDE_BREAKPOINT - 1, 900)
    expect(result.current.wide).toBe(false)
    expect(result.current.tocVisible).toBe(false)
    expect(result.current.scale).not.toBe(wideScale)

    rerender({ mode: 'present' as never })
    expect(result.current.tocVisible).toBe(false)
  })

  it.each([['plain', undefined], ['StrictMode', StrictMode]] as const)('removes every resize listener it added on unmount (%s)', (_name, wrapper) => {
    const added: EventListenerOrEventListenerObject[] = []
    const removed: EventListenerOrEventListenerObject[] = []
    const add = vi.spyOn(window, 'addEventListener').mockImplementation((type, fn) => void (type === 'resize' && added.push(fn as never)))
    const remove = vi.spyOn(window, 'removeEventListener').mockImplementation((type, fn) => void (type === 'resize' && removed.push(fn as never)))
    const { unmount } = renderHook(() => useFitScale('browse'), { wrapper })
    expect(added.length).toBeGreaterThan(0)
    unmount()
    add.mockRestore()
    remove.mockRestore()
    for (const fn of added) expect(removed).toContain(fn)
  })
})
