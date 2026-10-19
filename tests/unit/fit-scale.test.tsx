import { describe, expect, it } from 'vitest'
import { act, render } from '@testing-library/react'
import {
  DESIGN_H, DESIGN_W, MIN_SCALE, Presentation, STAGE_LAYOUT, TOC_MIN_WIDTH,
} from '../../src/presentation-kit'
import { availableStageSize, computeFitScale, stageScale, tocVisible } from '../../src/presentation-kit/fitScale'
import { makeSteps, press, setViewport } from './helpers'

const modes = ['browse', 'present'] as const

describe('fit scale', () => {
  it('uses an 880 x 380 default canvas', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it.each(modes)('returns exactly min(w/880, h/380) for %s geometry', (mode) => {
    for (const [width, height] of [[1440, 900], [1024, 768], [390, 844], [320, 568], [800, 300]]) {
      const avail = availableStageSize(mode, { width, height })
      const expected = Math.min(avail.width / DESIGN_W, avail.height / DESIGN_H)
      expect(stageScale(mode, { width, height })).toBe(expected)
    }
  })

  it('returns the raw fit even below MIN_SCALE (no lower clamp)', () => {
    const scale = stageScale('present', { width: 400, height: 200 })
    expect(scale).toBeGreaterThan(0)
    expect(scale).toBeLessThan(MIN_SCALE)
    expect(computeFitScale(40, 40)).toBe(40 / DESIGN_W)
    expect(computeFitScale(40, 40)).toBeLessThan(MIN_SCALE)
  })

  it('fits the 320 x 568 viewport in both modes without exceeding it', () => {
    for (const mode of modes) {
      const avail = availableStageSize(mode, { width: 320, height: 568 })
      const scale = stageScale(mode, { width: 320, height: 568 })
      expect(DESIGN_W * scale).toBeLessThanOrEqual(avail.width + 1e-9)
      expect(DESIGN_H * scale).toBeLessThanOrEqual(avail.height + 1e-9)
    }
  })

  it.each([0, -5, Number.NaN, Infinity, -Infinity])('falls back to MIN_SCALE for degenerate size %s', (bad) => {
    expect(computeFitScale(bad, 300)).toBe(MIN_SCALE)
    expect(computeFitScale(800, bad)).toBe(MIN_SCALE)
  })

  it('honours an explicit design canvas', () => {
    expect(computeFitScale(400, 200, 400, 100)).toBe(1)
    expect(stageScale('browse', { width: 1440, height: 900 }, 440, 190)).toBe(
      computeFitScale(...(Object.values(availableStageSize('browse', { width: 1440, height: 900 })) as [number, number]), 440, 190),
    )
  })

  it('shows the ToC only in browse mode at or above the wide threshold', () => {
    expect(tocVisible('browse', TOC_MIN_WIDTH)).toBe(true)
    expect(tocVisible('browse', TOC_MIN_WIDTH - 1)).toBe(false)
    expect(tocVisible('present', 4000)).toBe(false)
    expect(STAGE_LAYOUT.present.toc).toBe(0)
  })
})

describe('stage scaling in the presentation', () => {
  const stage = () => document.querySelector<HTMLElement>('[data-presentation-stage]')!
  const scaleOf = () => Number(stage().getAttribute('data-presentation-scale'))

  it('keeps one scale across steps, and recalculates on resize and mode change', () => {
    setViewport(1280, 800)
    render(<Presentation steps={makeSteps(['a', 'a', 'b'])} title="deck" />)
    const initial = scaleOf()
    expect(initial).toBe(stageScale('browse', { width: 1280, height: 800 }))
    press('ArrowRight')
    press('ArrowRight')
    expect(scaleOf()).toBe(initial)

    setViewport(700, 900)
    expect(scaleOf()).toBe(stageScale('browse', { width: 700, height: 900 }))
    expect(scaleOf()).not.toBe(initial)

    press('p')
    expect(scaleOf()).toBe(stageScale('present', { width: 700, height: 900 }))
  })

  it('applies one uniform scale to a canvas with unchanged internal dimensions', () => {
    setViewport(1280, 800)
    render(<Presentation steps={makeSteps(['a'])} title="deck" />)
    const before = { w: stage().style.width, h: stage().style.height }
    expect(before).toEqual({ w: '880px', h: '380px' })
    expect(stage().style.transform).toMatch(/scale\(/)
    expect(stage().style.transform).not.toMatch(/scale\([^)]*,/) // single uniform factor
    setViewport(500, 700)
    expect({ w: stage().style.width, h: stage().style.height }).toEqual(before)
    act(() => {})
  })

  it('uses 880 x 380 by default and honours overrides', () => {
    setViewport(1280, 800)
    const { unmount } = render(<Presentation steps={makeSteps(['a'])} title="deck" />)
    expect([stage().style.width, stage().style.height]).toEqual(['880px', '380px'])
    unmount()
    render(<Presentation steps={makeSteps(['a'])} title="deck" designWidth={600} designHeight={300} />)
    expect([stage().style.width, stage().style.height]).toEqual(['600px', '300px'])
  })
})
