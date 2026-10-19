import type { ComponentType } from 'react'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DESIGN_H, DESIGN_W, MIN_SCALE, Box, Presentation, STAGE_LAYOUT, TOC_WIDTH, WIDE_MIN_WIDTH,
  computeFitScale, useFitScale, type SceneProps, type Step,
} from '../../src/presentation-kit'
import { stageGeometry } from '../../src/presentation-kit/useFitScale'
import { motionCalls, resetMotionSpy } from '../helpers/motionSpy'

vi.mock('motion/react', async () => (await import('../helpers/motionSpy')).createMotionMock())

const original = { w: window.innerWidth, h: window.innerHeight }
function resize(width: number, height: number) {
  act(() => {
    Object.assign(window, { innerWidth: width, innerHeight: height })
    window.dispatchEvent(new Event('resize'))
  })
}
afterEach(() => {
  Object.assign(window, { innerWidth: original.w, innerHeight: original.h })
  resetMotionSpy()
})

const Scene: ComponentType<SceneProps<{ x: number }>> = ({ payload }) => <Box id="a" x={payload.x} y={40} w={100} h={50} />
const steps: Array<Step<{ x: number }>> = [10, 200, 330].map((x, i) => ({
  id: `s${i}`, era: 'E', title: `t${i}`, caption: 'c', Scene, groupKey: 'g', payload: { x },
}))
const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-root]')!
const stage = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-stage]')!
const canvas = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-canvas]')!
const scaleOf = (c: HTMLElement) => Number(stage(c).getAttribute('data-presentation-scale'))
const formula = (w: number, h: number, g: { top: number; bottom: number; left: number; right: number }) =>
  Math.max(MIN_SCALE, Math.min((w - g.left - g.right) / DESIGN_W, (h - g.top - g.bottom) / DESIGN_H))

describe('I-26 default canvas', () => {
  it('is 880 x 380 with separate browse and present geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(STAGE_LAYOUT.browse).toEqual({ top: 56, bottom: 220, left: 0, right: 0 })
    expect(STAGE_LAYOUT.present).toEqual({ top: 56, bottom: 120, left: 0, right: 0 })
    expect(STAGE_LAYOUT.present.bottom).toBeLessThan(STAGE_LAYOUT.browse.bottom)
  })

  it('Stage without size overrides consumes the defaults', () => {
    Object.assign(window, { innerWidth: 1760, innerHeight: 1200 })
    const { container } = render(<Presentation steps={steps} title="t" />)
    expect([canvas(container).style.width, canvas(container).style.height]).toEqual(['880px', '380px'])
    const s = scaleOf(container)
    const box = canvas(container).parentElement!
    expect([box.style.width, box.style.height]).toEqual([`${DESIGN_W * s}px`, `${DESIGN_H * s}px`])
  })
})

describe('I-27 uniform fit scaling', () => {
  it('computeFitScale is max(MIN_SCALE, min(availW/W, availH/H)) for wide, narrow and tiny viewports', () => {
    const g = STAGE_LAYOUT.present
    expect(computeFitScale({ width: 1760, height: 1200 }, g)).toBeCloseTo(2) // width-bound
    expect(computeFitScale({ width: 4000, height: 56 + 120 + 190 }, g)).toBeCloseTo(0.5) // height-bound
    expect(computeFitScale({ width: 440, height: 1000 }, g)).toBeCloseTo(0.5) // narrow
    expect(computeFitScale({ width: 10, height: 10 }, g)).toBe(MIN_SCALE) // floor
    expect(computeFitScale({ width: 800, height: 400 }, { top: 10, bottom: 10, left: 100, right: 100 })).toBeCloseTo(600 / DESIGN_W)
  })

  it('wide browse viewports reserve the ToC column; narrow ones do not', () => {
    expect(stageGeometry('browse', { width: WIDE_MIN_WIDTH, height: 800 }).left).toBe(TOC_WIDTH)
    expect(stageGeometry('browse', { width: WIDE_MIN_WIDTH - 1, height: 800 }).left).toBe(0)
    expect(stageGeometry('present', { width: 2000, height: 800 }).left).toBe(0)
  })

  it('useFitScale uses each mode geometry and recomputes on resize', () => {
    Object.assign(window, { innerWidth: 1440, innerHeight: 900 })
    const browse = renderHook(() => useFitScale('browse'))
    const present = renderHook(() => useFitScale('present'))
    expect(browse.result.current.scale).toBeCloseTo(formula(1440, 900, { ...STAGE_LAYOUT.browse, left: TOC_WIDTH }))
    expect(present.result.current.scale).toBeCloseTo(formula(1440, 900, STAGE_LAYOUT.present))
    expect(present.result.current.scale).not.toBeCloseTo(browse.result.current.scale)
    resize(600, 700)
    expect(browse.result.current.scale).toBeCloseTo(formula(600, 700, STAGE_LAYOUT.browse))
    expect(present.result.current.scale).toBeCloseTo(formula(600, 700, STAGE_LAYOUT.present))
    resize(50, 50)
    expect(present.result.current.scale).toBe(MIN_SCALE)
  })

  it('scale is identical on every step at a fixed viewport and mode, in both directions', () => {
    resize(1280, 800)
    const { container } = render(<Presentation steps={steps} title="t" />)
    const first = scaleOf(container)
    expect(first).toBeCloseTo(formula(1280, 800, { ...STAGE_LAYOUT.browse, left: TOC_WIDTH }))
    const seen: number[] = []
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft']) {
      fireEvent.keyDown(window, { key: k })
      seen.push(scaleOf(container))
    }
    expect(seen).toEqual([first, first, first, first])
    expect(canvas(container).style.transform).toBe(`scale(${first})`)
  })

  it('resize rescales uniformly on both axes without reflowing internal coordinates', () => {
    resize(1280, 800)
    const { container } = render(<Presentation steps={steps} title="t" />)
    const box = () => canvas(container).parentElement!
    const a = container.querySelector<HTMLElement>('[data-presentation-entity="a"]')!
    const coords = () => [a.style.left, a.style.top, a.style.width, a.style.height]
    const before = coords()
    const s1 = scaleOf(container)
    resize(700, 900)
    const s2 = scaleOf(container)
    expect(s2).not.toBeCloseTo(s1)
    expect(s2).toBeCloseTo(formula(700, 900, STAGE_LAYOUT.browse))
    expect(canvas(container).style.transform).toBe(`scale(${s2})`) // one scalar: uniform
    expect(parseFloat(box().style.width) / parseFloat(box().style.height)).toBeCloseTo(DESIGN_W / DESIGN_H)
    expect([canvas(container).style.width, canvas(container).style.height]).toEqual(['880px', '380px'])
    expect(coords()).toEqual(before)
  })

  it('mode switch applies the new geometry immediately and never animates the scale', () => {
    resize(1440, 900)
    const { container } = render(<Presentation steps={steps} title="t" />)
    const browseScale = scaleOf(container)
    const canvasNode = canvas(container)
    fireEvent.keyDown(window, { key: 'p' })
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    const presentScale = scaleOf(container)
    expect(presentScale).toBeCloseTo(formula(1440, 900, STAGE_LAYOUT.present))
    expect(presentScale).not.toBeCloseTo(browseScale)
    expect(canvas(container)).toBe(canvasNode)
    expect(canvasNode.style.transform).toBe(`scale(${presentScale})`) // applied directly, no tween
    const stageEl = stage(container)
    expect([stageEl.style.top, stageEl.style.bottom, stageEl.style.left]).toEqual(['56px', '120px', '0px'])
    // Neither the stage nor the canvas is a motion element, so no shared-layout scale animation exists.
    const tagged = motionCalls.filter((c) => 'data-presentation-stage' in c.props || 'data-presentation-canvas' in c.props)
    expect(tagged).toEqual([])
    fireEvent.keyDown(window, { key: 'p' })
    expect(scaleOf(container)).toBeCloseTo(browseScale)
    expect(stage(container).style.bottom).toBe('220px')
  })

  it('stage leaves a gap for header and footer', () => {
    resize(1440, 900)
    const { container } = render(<Presentation steps={steps} title="t" />)
    expect(stage(container).style.top).toBe('56px')
    expect(stage(container).style.bottom).toBe('220px')
  })
})
