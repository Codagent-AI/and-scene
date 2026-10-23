import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation, type Step } from '../../src/presentation-kit/index.ts'
import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  WIDE_VIEWPORT_PX,
} from '../../src/presentation-kit/constants.ts'
import { computeFitScale } from '../../src/presentation-kit/fit.ts'
import { sceneKey } from '../../src/presentation-kit/sceneKey.ts'
import { useFitScale, useIsWide } from '../../src/presentation-kit/useFitScale.ts'
import { CountingScene, OtherScene, makeSteps, mounts, setViewport, type P } from './fixtures.tsx'

vi.mock('motion/react', async () => (await import('./motion-mock.tsx')).motionMock)

const q = (sel: string) => document.querySelector(sel) as HTMLElement
const press = (k: string) =>
  act(() => {
    fireEvent.keyDown(window, { key: k })
  })

beforeEach(() => {
  setViewport(1280, 800)
  mounts.count = 0
  mounts.unmounts = 0
})

describe('persistent grouped scenes', () => {
  it('keeps one mounted scene instance across same-group, same-Scene steps and only changes the payload', () => {
    render(<Presentation steps={makeSteps()} title="d" />)
    const el = q('[data-presentation-scene]')
    expect(mounts.count).toBe(1)
    for (let n = 1; n < 6; n++) {
      press('ArrowRight')
      expect(q('[data-presentation-scene]')).toBe(el)
      expect(q('[data-testid="scene"]').textContent).toBe(`payload ${n}`)
    }
    expect(mounts.count).toBe(1)
    expect(mounts.unmounts).toBe(0)
  })

  it('keeps the grouped instance under StrictMode (only its dev double effect cycle)', () => {
    render(
      <StrictMode>
        <Presentation steps={makeSteps()} title="d" />
      </StrictMode>,
    )
    const base = mounts.count
    expect(base).toBeLessThanOrEqual(2)
    press('ArrowRight')
    press('ArrowRight')
    expect(mounts.count).toBe(base)
  })

  it('remounts when the group changes', () => {
    const steps = makeSteps(4).map((s, i) => ({ ...s, groupKey: i < 2 ? 'a' : 'b' }))
    render(<Presentation steps={steps} title="d" />)
    const first = q('[data-presentation-scene]')
    press('ArrowRight')
    expect(q('[data-presentation-scene]')).toBe(first)
    expect(mounts.count).toBe(1)
    press('ArrowRight')
    expect(q('[data-presentation-scene]')).not.toBe(first)
    expect(mounts.count).toBe(2)
    expect(mounts.unmounts).toBe(1)
    press('ArrowRight')
    expect(mounts.count).toBe(2)
  })

  it('remounts every step when steps carry no group key', () => {
    const steps = makeSteps(3).map((s) => ({ ...s, groupKey: undefined }))
    render(<Presentation steps={steps} title="d" />)
    press('ArrowRight')
    press('ArrowRight')
    expect(mounts.count).toBe(3)
    expect(mounts.unmounts).toBe(2)
  })

  it('does not reuse a scene instance when the Scene changes inside the same group', () => {
    const steps: Step<P>[] = makeSteps(3).map((s, i) => ({ ...s, Scene: i === 1 ? OtherScene : CountingScene }))
    render(<Presentation steps={steps} title="d" />)
    expect(q('[data-testid="scene"]')).not.toBeNull()
    press('ArrowRight')
    expect(q('[data-testid="scene"]')).toBeNull()
    expect(q('[data-testid="other-scene"]').textContent).toBe('other 1')
    expect(mounts.unmounts).toBe(1)
    press('ArrowRight')
    expect(q('[data-testid="scene"]').textContent).toBe('payload 2')
    expect(mounts.count).toBe(2)
  })

  it('derives the scene key from group + Scene identity', () => {
    const a = { id: 'x', groupKey: 'g', Scene: CountingScene }
    expect(sceneKey(a)).toBe(sceneKey({ ...a, id: 'y' }))
    expect(sceneKey(a)).not.toBe(sceneKey({ ...a, Scene: OtherScene }))
    expect(sceneKey(a)).not.toBe(sceneKey({ ...a, groupKey: 'h' }))
    expect(sceneKey({ ...a, groupKey: undefined })).not.toBe(sceneKey({ ...a, groupKey: undefined, id: 'z' }))
  })

  it('wraps the active scene in the presence host so scenes cross-fade between groups', () => {
    render(<Presentation steps={makeSteps()} title="d" />)
    const scene = q('[data-presentation-scene]')
    expect(scene.closest('[data-mock-presence]')).not.toBeNull()
    expect(scene.closest('[data-mock-layout-group]')).not.toBeNull()
    expect(JSON.parse(scene.dataset.mInitial!)).toEqual({ opacity: 0 })
    expect(JSON.parse(scene.dataset.mExit!).opacity).toBe(0)
    expect(JSON.parse(scene.dataset.mAnimate!).opacity).toBe(1)
  })
})

describe('fit scaling', () => {
  it('uses the default 880 x 380 canvas and the active mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(STAGE_LAYOUT.browse).not.toEqual(STAGE_LAYOUT.present)
    render(<Presentation steps={makeSteps()} title="d" />)
    const canvas = q('[data-presentation-canvas]')
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    const g = STAGE_LAYOUT.browse
    expect(Number(canvas.dataset.presentationScale)).toBeCloseTo(
      computeFitScale({ width: 1280, height: 800 }, 'browse', true),
    )
    const stage = q('[data-presentation-stage]')
    expect(stage.style.top).toBe(`${g.top}px`)
    press('p')
    expect(stage.style.top).toBe(`${STAGE_LAYOUT.present.top}px`)
  })

  it('computes the limiting ratio, with a floor, for wide, tall and tiny viewports in both modes', () => {
    const g = STAGE_LAYOUT.browse
    // wide viewport: height limits
    const wide = computeFitScale({ width: 3000, height: 800 }, 'browse', false)
    expect(wide).toBeCloseTo((800 - g.top - g.bottom) / DESIGN_H)
    // tall/narrow viewport: width limits
    const narrow = computeFitScale({ width: 440, height: 2000 }, 'browse', false)
    expect(narrow).toBeCloseTo(440 / DESIGN_W)
    // the ToC side column narrows the width budget
    expect(computeFitScale({ width: 1280, height: 4000 }, 'browse', true)).toBeCloseTo((1280 - g.side) / DESIGN_W)
    // present geometry
    const p = STAGE_LAYOUT.present
    expect(computeFitScale({ width: 3000, height: 700 }, 'present', true)).toBeCloseTo((700 - p.top - p.bottom) / DESIGN_H)
    // floor
    expect(computeFitScale({ width: 10, height: 10 }, 'browse', false)).toBe(MIN_SCALE)
    // custom canvas
    expect(computeFitScale({ width: 400, height: 4000 }, 'present', false, { width: 200, height: 100 })).toBeCloseTo(2)
  })

  it('recomputes one uniform scale on resize while the canvas keeps its fixed size', () => {
    render(<Presentation steps={makeSteps()} title="d" />)
    const canvas = q('[data-presentation-canvas]')
    const before = Number(canvas.dataset.presentationScale)
    act(() => setViewport(1600, 1000))
    const after = Number(canvas.dataset.presentationScale)
    expect(after).toBeGreaterThan(before)
    expect(after).toBeCloseTo(computeFitScale({ width: 1600, height: 1000 }, 'browse', true))
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    expect(canvas.style.scale).toBe(String(after))
    // wrapper tracks the scaled size
    const box = canvas.parentElement as HTMLElement
    expect(parseFloat(box.style.width)).toBeCloseTo(880 * after)
    expect(parseFloat(box.style.height)).toBeCloseTo(380 * after)
  })

  it('removes its resize listener on unmount', () => {
    const removed: string[] = []
    const rem = window.removeEventListener.bind(window)
    window.removeEventListener = ((t: string, ...a: unknown[]) => {
      removed.push(t)
      return (rem as (...x: unknown[]) => void)(t, ...a)
    }) as typeof window.removeEventListener
    try {
      const { unmount } = renderHook(() => useFitScale('browse', true))
      unmount()
      expect(removed).toContain('resize')
    } finally {
      window.removeEventListener = rem
    }
  })

  it('reports wide viewports from the shared threshold', () => {
    setViewport(WIDE_VIEWPORT_PX, 800)
    const { result } = renderHook(() => useIsWide())
    expect(result.current).toBe(true)
    act(() => setViewport(WIDE_VIEWPORT_PX - 1, 800))
    expect(result.current).toBe(false)
  })
})
