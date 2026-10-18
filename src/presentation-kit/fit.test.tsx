import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, LAYOUT_T, MIN_SCALE, STAGE_LAYOUT } from './constants'
import { computeFit } from './fit'
import type { Mode } from './types'
import { useFitScale } from './useFitScale'

describe('constants', () => {
  it('defaults to an 880 × 380 canvas with per-mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(STAGE_LAYOUT.browse).not.toEqual(STAGE_LAYOUT.present)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('newcomers wait for the whole persisting layout morph', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})

describe('computeFit', () => {
  const g = STAGE_LAYOUT.present
  it('scales uniformly to the tighter axis', () => {
    const wide = computeFit(2000, 700, g, false)
    const availH = 700 - g.top - g.bottom
    expect(wide.scale).toBeCloseTo(availH / DESIGN_H)
    const tall = computeFit(600, 2000, g, false)
    expect(tall.scale).toBeCloseTo((600 - g.left - g.right) / DESIGN_W)
  })

  it('never goes below MIN_SCALE', () => {
    expect(computeFit(50, 50, g, false).scale).toBe(MIN_SCALE)
  })

  it('centers the canvas in the available area', () => {
    const fit = computeFit(2000, 700, g, false)
    const availW = 2000 - g.left - g.right
    expect(fit.x).toBeCloseTo(g.left + (availW - DESIGN_W * fit.scale) / 2)
  })

  it('reserves the table-of-contents width only when visible', () => {
    const b = STAGE_LAYOUT.browse
    const without = computeFit(1440, 900, b, false)
    const withToc = computeFit(1440, 900, b, true)
    expect(withToc.scale).toBeLessThan(without.scale)
    expect(withToc.x).toBeGreaterThanOrEqual(b.left + b.tocWidth)
  })
})

describe('useFitScale', () => {
  const original = HTMLElement.prototype.getBoundingClientRect
  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = original
    vi.unstubAllGlobals()
  })

  function Probe({ mode, toc = false }: { mode: Mode; toc?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const fit = useFitScale(ref, mode, toc)
    return <div ref={ref} data-testid="r" data-fit={JSON.stringify(fit)} />
  }

  const rect = (width: number, height: number) =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width, height } as DOMRect)

  it('measures the region and keeps the scale constant when only content changes', () => {
    rect(1440, 900)
    const { getByTestId, rerender } = render(<Probe mode="present" />)
    const first = getByTestId('r').dataset.fit
    expect(JSON.parse(first!).scale).toBeCloseTo(computeFit(1440, 900, STAGE_LAYOUT.present, false).scale)
    rerender(<Probe mode="present" />)
    expect(getByTestId('r').dataset.fit).toBe(first)
  })

  it('recomputes per mode', () => {
    rect(1440, 900)
    const { getByTestId, rerender } = render(<Probe mode="present" />)
    const present = getByTestId('r').dataset.fit
    rerender(<Probe mode="browse" />)
    expect(getByTestId('r').dataset.fit).not.toBe(present)
  })

  it('follows ResizeObserver updates', () => {
    let notify: () => void = () => {}
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          notify = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    const spy = rect(1440, 900)
    const { getByTestId } = render(<Probe mode="present" />)
    const before = getByTestId('r').dataset.fit
    spy.mockReturnValue({ width: 700, height: 500 } as DOMRect)
    notify()
    return vi.waitFor(() => expect(getByTestId('r').dataset.fit).not.toBe(before))
  })
})
