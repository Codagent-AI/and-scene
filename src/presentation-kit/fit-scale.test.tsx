import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { SceneProps, Step } from './types'
import { computeFitScale, useFitScale } from './useFitScale'

type Payload = { label: string }

/** Scene with an absolutely positioned child at fixed design coordinates (left 100, top 50). */
const Scene = ({ payload }: SceneProps<Payload>) => (
  <div data-testid="child" style={{ position: 'absolute', left: 100, top: 50, width: 200, height: 40 }}>
    {payload.label}
  </div>
)

const steps: Step<Payload>[] = [
  { id: 'a', era: 'Intro', title: 'One', caption: 'c1', Scene, payload: { label: 'p-a' } },
  { id: 'b', era: 'Intro', title: 'Two', caption: 'c2', Scene, payload: { label: 'p-b' } },
  { id: 'c', era: 'Core', title: 'Three', caption: 'c3', Scene, payload: { label: 'p-c' } },
]

const canvasEl = () => document.querySelector<HTMLElement>('[data-presentation-canvas]')!
const stageEl = () => document.querySelector<HTMLElement>('[data-presentation-stage]')!

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

beforeEach(() => {
  setViewport(1000, 700)
  // Presentation reads the ToC breakpoint through matchMedia; stub it so the mount is deterministic.
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
    return {
      media: query,
      onchange: null,
      get matches() {
        return window.innerWidth >= min
      },
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }
  }) as unknown as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete (window as { matchMedia?: unknown }).matchMedia
})

describe('L-26 uniform fit scaling', () => {
  // Hand-computed from the geometry: browse insets 24/72/220, present insets 24/72/120, canvas 880x380.
  it.each([
    // [label, mode, width, height, expected]
    ['wide browse 1000x700 is height-bound', 'browse', 1000, 700, (700 - 72 - 220) / 380],
    ['wide browse 2000x1000 is height-bound', 'browse', 2000, 1000, (1000 - 72 - 220) / 380],
    ['present 1000x500 is height-bound', 'present', 1000, 500, (500 - 72 - 120) / 380],
    ['short wide present 2000x300 is height-bound', 'present', 2000, 300, (300 - 72 - 120) / 380],
    ['narrow browse 300x900 is width-bound', 'browse', 300, 900, (300 - 48) / 880],
    ['narrow present 500x900 is width-bound', 'present', 500, 900, (500 - 48) / 880],
    ['tiny viewport clamps to MIN_SCALE', 'browse', 200, 200, MIN_SCALE],
    ['degenerate height clamps to MIN_SCALE', 'present', 1600, 100, MIN_SCALE],
  ] as const)('%s', (_label, mode, w, h, expected) => {
    expect(computeFitScale({ width: w, height: h }, mode)).toBeCloseTo(expected, 10)
  })

  it('uses the mode-specific insets: present fits a larger scale than browse for the same viewport', () => {
    const browse = computeFitScale({ width: 1000, height: 700 }, 'browse')
    const present = computeFitScale({ width: 1000, height: 700 }, 'present')
    expect(present).toBeGreaterThan(browse)
  })

  it('applies one uniform scale to an unchanged design-sized canvas, with child coordinates unchanged', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const scale = (700 - 72 - 220) / 380
    const canvas = canvasEl()
    expect(canvas.style.width).toBe(`${DESIGN_W}px`)
    expect(canvas.style.height).toBe(`${DESIGN_H}px`)
    expect(canvas.style.transform).toBe(`scale(${scale})`)
    expect(Number(canvas.dataset.presentationScale)).toBeCloseTo(scale, 10)
    expect(stageEl().style.width).toBe(`${DESIGN_W * scale}px`)

    const child = document.querySelector<HTMLElement>('[data-testid="child"]')!
    expect(child.style.left).toBe('100px')
    expect(child.style.top).toBe('50px')
    expect(child.style.width).toBe('200px')
  })

  it('updates the applied scale on resize of the mounted presentation without reflowing the canvas', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expect(Number(canvasEl().dataset.presentationScale)).toBeCloseTo((700 - 292) / 380, 10)

    setViewport(500, 700)
    const narrowScale = (500 - 48) / 880
    expect(Number(canvasEl().dataset.presentationScale)).toBeCloseTo(narrowScale, 10)
    expect(canvasEl().style.transform).toBe(`scale(${narrowScale})`)
    expect(canvasEl().style.width).toBe(`${DESIGN_W}px`)
    expect(document.querySelector<HTMLElement>('[data-testid="child"]')!.style.left).toBe('100px')

    setViewport(1000, 700)
    expect(Number(canvasEl().dataset.presentationScale)).toBeCloseTo((700 - 292) / 380, 10)
  })

  it('recomputes with present geometry when the mode toggles', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const browse = Number(canvasEl().dataset.presentationScale)
    fireEvent.keyDown(document.body, { key: 'p' })
    const present = Number(canvasEl().dataset.presentationScale)
    // At 1000x700 present is width-bound: min(952/880, 508/380).
    expect(present).toBeCloseTo(Math.min((1000 - 48) / 880, (700 - 72 - 120) / 380), 10)
    expect(present).toBeGreaterThan(browse)
  })
})

describe('L-27 default canvas and override', () => {
  it('exports the 880 x 380 default canvas and the browse/present fit geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(STAGE_LAYOUT.browse).toEqual({ insetX: 24, insetTop: 72, insetBottom: 220 })
    expect(STAGE_LAYOUT.present).toEqual({ insetX: 24, insetTop: 72, insetBottom: 120 })
  })

  it('a presentation without overrides renders an 880 x 380 canvas and fits it', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expect(canvasEl().style.width).toBe('880px')
    expect(canvasEl().style.height).toBe('380px')
    expect(Number(canvasEl().dataset.presentationScale)).toBeCloseTo((700 - 292) / 380, 10)
  })

  it('a distinct canvas override is honored by both the canvas geometry and the fit calculation', () => {
    render(<Presentation steps={steps} title="Deck" canvas={{ width: 400, height: 300 }} />)
    const scale = Math.min((1000 - 48) / 400, (700 - 292) / 300)
    expect(canvasEl().style.width).toBe('400px')
    expect(canvasEl().style.height).toBe('300px')
    expect(Number(canvasEl().dataset.presentationScale)).toBeCloseTo(scale, 10)
    expect(canvasEl().style.transform).toBe(`scale(${scale})`)
    expect(parseFloat(stageEl().style.width)).toBeCloseTo(400 * scale, 6)
    expect(parseFloat(stageEl().style.height)).toBeCloseTo(300 * scale, 6)
  })

  it('computeFitScale honors an explicit canvas argument', () => {
    expect(computeFitScale({ width: 1000, height: 700 }, 'browse', { width: 400, height: 300 })).toBeCloseTo(
      Math.min((1000 - 48) / 400, (700 - 292) / 300),
      10,
    )
  })
})

describe('X-4 fit hook under StrictMode', () => {
  const StrictWrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>

  it('keeps exactly one active resize listener and removes it on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { result, unmount } = renderHook(() => useFitScale('browse'), { wrapper: StrictWrapper })
    const added = addSpy.mock.calls.filter((c) => c[0] === 'resize').map((c) => c[1])
    const removed = removeSpy.mock.calls.filter((c) => c[0] === 'resize').map((c) => c[1])
    const active = added.filter((fn) => !removed.includes(fn))
    expect(active).toHaveLength(1)

    setViewport(500, 700)
    expect(result.current).toBeCloseTo((500 - 48) / 880, 10)

    unmount()
    const addedAfter = addSpy.mock.calls.filter((c) => c[0] === 'resize').map((c) => c[1])
    const removedAfter = removeSpy.mock.calls.filter((c) => c[0] === 'resize').map((c) => c[1])
    expect(addedAfter.filter((fn) => !removedAfter.includes(fn))).toHaveLength(0)
  })
})
