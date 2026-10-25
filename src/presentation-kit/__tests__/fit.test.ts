import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, TOC_BREAKPOINT } from '../constants.ts'
import { computeFitScale, showsToc } from '../useFitScale.ts'

describe('fixed-canvas fit scaling', () => {
  it('defaults the design canvas to 880 x 380 with browse and present geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('scales uniformly: the limiting axis decides, never stretching one axis', () => {
    const g = STAGE_LAYOUT.present
    const wide = computeFitScale({ width: 3000, height: 700 }, 'present')
    expect(wide).toBeCloseTo((700 - g.top - g.bottom) / DESIGN_H)
    const tall = computeFitScale({ width: 600, height: 3000 }, 'present')
    expect(tall).toBeCloseTo((600 - g.side * 2) / DESIGN_W)
  })

  it('shrinks and grows with the viewport', () => {
    const big = computeFitScale({ width: 1600, height: 1000 }, 'present')
    const small = computeFitScale({ width: 800, height: 600 }, 'present')
    expect(big).toBeGreaterThan(small)
  })

  it('always fits the available area: small viewports are never clipped by a scale floor', () => {
    for (const mode of ['browse', 'present'] as const) {
      for (const [width, height] of [[390, 300], [320, 260], [600, 280], [1400, 330], [1100, 400]]) {
        const g = STAGE_LAYOUT[mode]
        const toc = showsToc(mode, width) ? g.tocWidth : 0
        const availW = width - g.side * 2 - toc
        const availH = height - g.top - g.bottom
        const scale = computeFitScale({ width, height }, mode)
        expect(DESIGN_W * scale, `${mode} ${width}x${height} width`).toBeLessThanOrEqual(availW + 1e-6)
        expect(DESIGN_H * scale, `${mode} ${width}x${height} height`).toBeLessThanOrEqual(availH + 1e-6)
      }
    }
  })

  it('falls back to a tiny positive scale only when the chrome leaves no room at all', () => {
    expect(computeFitScale({ width: 10, height: 10 }, 'browse')).toBe(MIN_SCALE)
    expect(MIN_SCALE).toBeGreaterThan(0)
  })

  it('reserves room for the table of contents only in wide browse layouts', () => {
    expect(showsToc('browse', TOC_BREAKPOINT)).toBe(true)
    expect(showsToc('browse', TOC_BREAKPOINT - 1)).toBe(false)
    expect(showsToc('present', 3000)).toBe(false)
    const withToc = computeFitScale({ width: TOC_BREAKPOINT, height: 5000 }, 'browse')
    const without = computeFitScale({ width: TOC_BREAKPOINT - 1, height: 5000 }, 'browse')
    expect(withToc).toBeLessThan(without)
  })

  it('honours a canvas override', () => {
    const base = computeFitScale({ width: 1000, height: 5000 }, 'present')
    const half = computeFitScale({ width: 1000, height: 5000 }, 'present', { width: DESIGN_W * 2, height: DESIGN_H * 2 })
    expect(half).toBeCloseTo(base / 2)
  })
})
