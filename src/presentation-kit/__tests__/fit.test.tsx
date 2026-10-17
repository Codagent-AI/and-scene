import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRef } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../constants'
import { computeFitScale, useFitScale } from '../useFitScale'
import type { Mode } from '../types'

describe('canvas constants', () => {
  it('defaults to an 880 x 380 design canvas with per-mode fit geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(MIN_SCALE).toBeGreaterThan(0)
  })
})

describe('computeFitScale', () => {
  it('fits by the limiting axis uniformly', () => {
    const { padX, padY } = STAGE_LAYOUT.browse
    // width-limited
    expect(computeFitScale(440 + 2 * padX, 10_000, 'browse')).toBeCloseTo(0.5)
    // height-limited
    expect(computeFitScale(10_000, 190 + 2 * padY, 'browse')).toBeCloseTo(0.5)
  })

  it('uses each mode\'s own geometry', () => {
    const browse = computeFitScale(1000, 600, 'browse')
    const present = computeFitScale(1000, 600, 'present')
    expect(browse).not.toBe(present)
    expect(browse).toBeCloseTo(
      Math.min((1000 - 2 * STAGE_LAYOUT.browse.padX) / DESIGN_W, (600 - 2 * STAGE_LAYOUT.browse.padY) / DESIGN_H),
    )
  })

  it('clamps at MIN_SCALE and honors a custom canvas', () => {
    expect(computeFitScale(0, 0, 'browse')).toBe(MIN_SCALE)
    const custom = computeFitScale(1000, 1000, 'present', { width: 400, height: 400 })
    const { padX, padY } = STAGE_LAYOUT.present
    expect(custom).toBeCloseTo(Math.min((1000 - 2 * padX) / 400, (1000 - 2 * padY) / 400))
  })
})

const sizeOf = { w: 0, h: 0 }
const original = {
  w: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth'),
  h: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
}
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => sizeOf.w })
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => sizeOf.h })
afterEach(() => {
  sizeOf.w = 0
  sizeOf.h = 0
})
void original

function Probe({ mode }: { mode: Mode }) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref, mode)
  return (
    <div ref={ref} data-testid="probe">
      {scale.toFixed(4)}
    </div>
  )
}

describe('useFitScale', () => {
  it('recomputes on window resize and on mode change', () => {
    sizeOf.w = 1000
    sizeOf.h = 600
    const view = render(<Probe mode="browse" />)
    const read = () => Number(view.getByTestId('probe').textContent)
    const first = read()
    expect(first).toBeCloseTo(computeFitScale(1000, 600, 'browse'), 3)

    sizeOf.w = 500
    sizeOf.h = 300
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(read()).toBeCloseTo(computeFitScale(500, 300, 'browse'), 3)

    view.rerender(<Probe mode="present" />)
    expect(read()).toBeCloseTo(computeFitScale(500, 300, 'present'), 3)
  })
})
