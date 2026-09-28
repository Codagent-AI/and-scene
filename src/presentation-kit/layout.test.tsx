import { render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { Stage } from './Stage'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Step } from './types'

function Scene() {
  return <div data-testid="scene" />
}

const STEPS: Array<Step<undefined>> = [
  { id: 'one', era: 'Intro', title: 'One', caption: 'One caption', Scene, payload: undefined },
  { id: 'two', era: 'Outro', title: 'Two', caption: 'Two caption', Scene, payload: undefined },
]

const originalWidth = window.innerWidth
const originalHeight = window.innerHeight

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

afterEach(() => {
  setViewport(originalWidth, originalHeight)
  document.body.innerHTML = ''
})

describe('fixed-canvas layout geometry', () => {
  it('sizes the scaler footprint to the scaled canvas so it never overflows its container', () => {
    const { container } = render(<Stage steps={STEPS} stepIndex={0} scale={0.5} />)
    const scaler = container.querySelector<HTMLElement>('[data-presentation-stage-scaler]')
    expect(scaler?.style.margin).toBe(`${(DESIGN_H * 0.5 - DESIGN_H) / 2}px ${(DESIGN_W * 0.5 - DESIGN_W) / 2}px`)
  })

  it('places the stage in the gap between the active mode chrome bands', () => {
    const { container } = render(<Presentation steps={STEPS} title="Demo" />)
    const stage = container.querySelector<HTMLElement>('[data-presentation-stage]')
    expect(stage?.style.position).toBe('absolute')
    expect(stage?.style.top).toBe(`${STAGE_LAYOUT.browse.chromeTop}px`)
    expect(stage?.style.bottom).toBe(`${STAGE_LAYOUT.browse.chromeBottom}px`)
  })

  it('anchors the footer to the bottom edge and the attribution to the bottom-right corner', () => {
    const { container } = render(<Presentation steps={STEPS} title="Demo" />)
    const footer = container.querySelector<HTMLElement>('[data-presentation-footer]')
    expect(footer?.style.position).toBe('absolute')
    expect(footer?.style.bottom).toBe('0px')
    const attribution = container.querySelector<HTMLElement>('[data-presentation-attribution]')
    expect(attribution?.style.position).toBe('absolute')
    expect(attribution?.style.right).toBe('0px')
    expect(attribution?.style.bottom).toBe('0px')
  })

  it('pins the table of contents to the left edge', () => {
    setViewport(1280, 800)
    const { container } = render(<Presentation steps={STEPS} title="Demo" />)
    const toc = container.querySelector<HTMLElement>('[data-presentation-toc]')
    expect(toc?.style.position).toBe('absolute')
    expect(toc?.style.left).toBe('0px')
  })

  it('reserves side gutters for the table of contents when fitting the canvas', () => {
    setViewport(1280, 800)
    const withToc = renderHook(() => useFitScale('browse', true)).result.current
    const withoutToc = renderHook(() => useFitScale('browse', false)).result.current
    expect(withToc).toBeCloseTo((1280 - 2 * STAGE_LAYOUT.browse.tocGutter) / DESIGN_W)
    expect(withoutToc).toBeCloseTo(1280 / DESIGN_W)
  })
})
