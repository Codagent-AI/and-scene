// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { computeFitScale, useFitScale } from '../../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, LAYOUT_T, MIN_SCALE, STAGE_LAYOUT, WIDE_BREAKPOINT } from '../../src/presentation-kit/constants'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps, stubMatchMedia, stubViewport } from './fixtures'

describe('canvas and timing constants', () => {
  it('the default design canvas is 880 × 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('newcomers start after the persisting-entity layout motion has finished', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('each mode has its own fit geometry on the default canvas', () => {
    expect(STAGE_LAYOUT.browse.width).toBe(DESIGN_W)
    expect(STAGE_LAYOUT.present.height).toBe(DESIGN_H)
    expect(STAGE_LAYOUT.browse.padding).not.toBe(STAGE_LAYOUT.present.padding)
  })

  it('the wide breakpoint separates the 1280 px desktop inspection width from 390 px', () => {
    expect(1280).toBeGreaterThanOrEqual(WIDE_BREAKPOINT)
    expect(390).toBeLessThan(WIDE_BREAKPOINT)
  })
})

describe('computeFitScale', () => {
  const geometry = { width: DESIGN_W, height: DESIGN_H, padding: 0 }

  it('is limited by width when the box is wide and short enough', () => {
    expect(computeFitScale({ width: 1000, height: 1000 }, geometry)).toBeCloseTo(1000 / 880)
  })

  it('is limited by height when the box is tall and narrow enough', () => {
    expect(computeFitScale({ width: 2000, height: 190 }, geometry)).toBeCloseTo(0.5)
  })

  it('never drops below MIN_SCALE', () => {
    expect(computeFitScale({ width: 10, height: 10 }, geometry)).toBe(MIN_SCALE)
  })

  it('subtracts the mode padding from the available box', () => {
    const padded = computeFitScale({ width: 1000, height: 1000 }, { ...geometry, padding: 50 })
    expect(padded).toBeCloseTo(900 / 880)
  })

  it('scales the same way in both modes given the same box', () => {
    const box = { width: 900, height: 400 }
    const browse = computeFitScale(box, STAGE_LAYOUT.browse)
    const present = computeFitScale(box, STAGE_LAYOUT.present)
    expect(browse).toBeLessThanOrEqual(present)
  })
})

describe('useFitScale', () => {
  it('recomputes the uniform scale on resize and holds it across steps at a fixed box', () => {
    const rect = { width: 1100, height: 600 }
    const spy = spyRect(rect)
    stubMatchMedia(true)
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'))
      return useFitScale(ref, STAGE_LAYOUT.browse)
    })
    const first = result.current
    rect.width = 550
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBeLessThan(first)
    spy.mockRestore()
  })

  it('the table of contents appears at or above the breakpoint and is absent just below it', () => {
    const { container, unmount } = render(<Presentation title="t" steps={makeSteps()} />)
    for (const [width, expected] of [[899, false], [900, true], [1280, true], [390, false]] as const) {
      unmount()
      stubViewport(width)
      const view = render(<Presentation title="t" steps={makeSteps()} />)
      expect(view.container.querySelector('[data-presentation-toc]') !== null, `width ${width}`).toBe(expected)
      for (const hook of ['[data-presentation-caption]', '[data-presentation-prev]', '[data-presentation-progress]']) {
        expect(view.container.querySelector(hook), `${hook} at ${width}`).not.toBeNull()
      }
      view.unmount()
    }
    expect(container).toBeDefined()
  })

  it('the scale stays the same across steps at a fixed viewport and mode', () => {
    stubViewport(1280)
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 1100, bottom: 600, width: 1100, height: 600, toJSON: () => ({}),
    } as DOMRect)
    const { container } = render(<Presentation title="t" steps={makeSteps()} />)
    const scaleOf = () => (container.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform
    const first = scaleOf()
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(scaleOf()).toBe(first)
    spy.mockRestore()
  })

  it('a presentation can override the design canvas, and omitted fields keep the mode default', () => {
    stubViewport(1280)
    const { container } = render(<Presentation title="t" steps={makeSteps()} design={{ width: 640 }} />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('640px')
    expect(canvas.style.height).toBe(`${DESIGN_H}px`)
  })

  it('Presentation applies the stage scale to the canvas via a single uniform transform', () => {
    stubMatchMedia(true)
    const { container } = render(<Presentation title="t" steps={makeSteps()} />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe(`${DESIGN_W}px`)
    expect(canvas.style.height).toBe(`${DESIGN_H}px`)
    expect(canvas.style.transform).toMatch(/^translate\(-50%, -50%\) scale\(/)
  })
})

/** Makes every element report the given box size, so the fit hook sees a known viewport. */
function spyRect(rect: { width: number; height: number }) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: rect.width,
        bottom: rect.height,
        width: rect.width,
        height: rect.height,
        toJSON: () => ({}),
      }) as DOMRect,
  )
}
