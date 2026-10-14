import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from '../../../src/presentation-kit/constants'
import { computeFitScale, stageRect } from '../../../src/presentation-kit/geometry'

describe('stageRect', () => {
  it('reserves the header and footer heights from the active mode geometry', () => {
    const layout = STAGE_LAYOUT.browse
    const rect = stageRect({ viewportWidth: 800, viewportHeight: 900, mode: 'browse' })

    expect(rect.top).toBe(layout.top)
    expect(rect.height).toBe(900 - layout.top - layout.bottom)
  })

  it('reserves the table-of-contents column only for browse mode on wide viewports', () => {
    const wide = stageRect({ viewportWidth: WIDE_VIEWPORT, viewportHeight: 900, mode: 'browse' })
    const narrow = stageRect({ viewportWidth: WIDE_VIEWPORT - 1, viewportHeight: 900, mode: 'browse' })
    const present = stageRect({ viewportWidth: WIDE_VIEWPORT, viewportHeight: 900, mode: 'present' })

    expect(wide.left).toBe(STAGE_LAYOUT.browse.side)
    expect(wide.width).toBe(WIDE_VIEWPORT - STAGE_LAYOUT.browse.side)
    expect(narrow.left).toBe(0)
    expect(present.left).toBe(0)
  })

  it('never reports negative sizes', () => {
    const rect = stageRect({ viewportWidth: 10, viewportHeight: 10, mode: 'present' })
    expect(rect.width).toBeGreaterThanOrEqual(0)
    expect(rect.height).toBeGreaterThanOrEqual(0)
  })
})

describe('computeFitScale', () => {
  it('uses the default 880 x 380 canvas and the limiting axis', () => {
    const viewportWidth = 1600
    const viewportHeight = 1000
    const layout = STAGE_LAYOUT.present
    const rect = stageRect({ viewportWidth, viewportHeight, mode: 'present' })
    const availableWidth = rect.width - 2 * layout.inset
    const availableHeight = rect.height - 2 * layout.inset

    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(computeFitScale({ viewportWidth, viewportHeight, mode: 'present' })).toBeCloseTo(
      Math.min(availableWidth / DESIGN_W, availableHeight / DESIGN_H),
    )
  })

  it('scales down on a narrow viewport so the canvas fits uniformly', () => {
    const scale = computeFitScale({ viewportWidth: 500, viewportHeight: 900, mode: 'browse' })
    expect(scale).toBeLessThan(1)
    expect(scale * DESIGN_W).toBeLessThanOrEqual(500)
  })

  it('is a pure function of viewport and mode, so it is constant across steps', () => {
    const first = computeFitScale({ viewportWidth: 1200, viewportHeight: 800, mode: 'browse' })
    const second = computeFitScale({ viewportWidth: 1200, viewportHeight: 800, mode: 'browse' })
    expect(second).toBe(first)
  })

  it('floors at MIN_SCALE for degenerate viewports', () => {
    expect(computeFitScale({ viewportWidth: 1, viewportHeight: 1, mode: 'browse' })).toBe(MIN_SCALE)
  })
})
