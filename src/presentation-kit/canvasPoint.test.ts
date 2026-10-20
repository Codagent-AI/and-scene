import { describe, expect, it } from 'vitest'
import { pageToCanvas, renderedScale } from './canvasPoint.ts'

function canvas(offsetWidth: number, renderedWidth: number): HTMLElement {
  return { offsetWidth, getBoundingClientRect: () => ({ width: renderedWidth }) } as unknown as HTMLElement
}

describe('canvas page points', () => {
  it('reads the rendered scale from the DOM', () => {
    expect(renderedScale(canvas(880, 326))).toBeCloseTo(326 / 880)
  })

  it('falls back to 1 when the canvas is missing, unmeasurable, or degenerate', () => {
    expect(renderedScale(null)).toBe(1)
    expect(renderedScale(canvas(0, 0))).toBe(1)
    expect(renderedScale(canvas(880, 0))).toBe(1)
  })

  it('divides measured points by the scale so layout deltas are in canvas coordinates', () => {
    const el = canvas(880, 440)
    const from = pageToCanvas(el, { x: 54, y: 10 })
    const to = pageToCanvas(el, { x: 217, y: 10 })
    expect(to.x - from.x).toBeCloseTo((217 - 54) * 2)
    expect(to.y - from.y).toBe(0)
  })

  it('leaves points untouched at full scale or without a canvas', () => {
    const point = { x: 5, y: 7 }
    expect(pageToCanvas(canvas(880, 880), point)).toBe(point)
    expect(pageToCanvas(null, point)).toBe(point)
  })
})
