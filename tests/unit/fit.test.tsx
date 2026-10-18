import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  Stage,
  computeFitScale,
  useFitScale
} from '../../src/presentation-kit'
import { setViewport } from '../support/setup'
import { makeDeck } from '../support/deck'

const expected = (w: number, h: number, mode: 'browse' | 'present') => {
  const g = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min((w - g.side * 2) / DESIGN_W, (h - g.top - g.bottom) / DESIGN_H))
}

describe('fixed canvas', () => {
  it('defaults to 880 x 380 with per-mode geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(STAGE_LAYOUT.browse.bottom).toBeGreaterThan(STAGE_LAYOUT.present.bottom)
  })

  it.each([
    [1440, 900],
    [390, 844],
    [1920, 400],
    [100, 100],
    [2560, 1440],
  ])('scales uniformly for %ix%i in both modes', (w, h) => {
    for (const mode of ['browse', 'present'] as const) {
      expect(computeFitScale(w, h, mode)).toBeCloseTo(expected(w, h, mode), 10)
    }
  })

  it('never goes below MIN_SCALE', () => {
    expect(computeFitScale(10, 10, 'browse')).toBe(MIN_SCALE)
  })
})

function ScaleProbe({ mode }: { mode: 'browse' | 'present' }) {
  return <output data-testid="scale">{useFitScale(mode)}</output>
}

describe('useFitScale', () => {
  it('follows the viewport on resize and cleans up its listener', () => {
    setViewport(1440, 900)
    const { unmount } = render(<ScaleProbe mode="browse" />)
    expect(Number(screen.getByTestId('scale').textContent)).toBeCloseTo(expected(1440, 900, 'browse'))
    act(() => {
      setViewport(700, 700)
      window.dispatchEvent(new Event('resize'))
    })
    expect(Number(screen.getByTestId('scale').textContent)).toBeCloseTo(expected(700, 700, 'browse'))
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(remove.mock.calls.map((c) => c[0])).toContain('resize')
    remove.mockRestore()
    setViewport(1440, 900)
  })
})

describe('Stage', () => {
  it('applies one uniform scale to a fixed canvas and keeps it across steps', () => {
    setViewport(1200, 800)
    const deck = makeDeck()
    const { rerender } = render(<Stage step={deck[0]} mode="browse" />)
    const canvas = () => document.querySelector<HTMLElement>('[data-presentation-canvas]')!
    const scale = Number(canvas().dataset.presentationScale)
    expect(scale).toBeCloseTo(expected(1200, 800, 'browse'), 3)
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    expect(canvas().style.height).toBe(`${DESIGN_H}px`)
    expect(canvas().style.transform).toMatch(/scale/)
    rerender(<Stage step={deck[1]} mode="browse" />)
    expect(Number(canvas().dataset.presentationScale)).toBe(scale)
    rerender(<Stage step={deck[1]} mode="present" />)
    expect(Number(canvas().dataset.presentationScale)).toBeCloseTo(expected(1200, 800, 'present'), 3)
    setViewport(1440, 900)
  })
})
