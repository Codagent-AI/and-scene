import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_MIN_PX } from './constants'
import { estimateStageRegion, fitScale, isWide } from './useFitScale'
import type { Canvas, SceneProps, Step } from './types'

function Positioned({ payload }: SceneProps<string>) {
  return (
    <div data-testid="pos" style={{ position: 'absolute', left: 100, top: 50, width: 200, height: 80 }}>
      {payload}
    </div>
  )
}

const steps: Step<string>[] = ['one', 'two', 'three'].map((payload, i) => ({
  id: `s${i}`,
  era: 'Only',
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  groupKey: 'g',
  Scene: Positioned,
  payload,
}))

const CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

function setViewport(width: number, height: number) {
  window.innerWidth = width
  window.innerHeight = height
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function canvasEl(): HTMLElement {
  return document.querySelector('[data-presentation-canvas]') as HTMLElement
}

function scaleAttr(): number {
  return Number(canvasEl().dataset.presentationScale)
}

function scaleInTransform(): number {
  const m = /scale\(([^)]+)\)/.exec(canvasEl().style.transform)
  if (!m) throw new Error(`no scale in transform: ${canvasEl().style.transform}`)
  return Number(m[1])
}

function mockStageMeasure(width: number, height: number) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => height })
}

beforeEach(() => {
  window.innerWidth = 1440
  window.innerHeight = 900
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth')
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
})

describe('fitScale pure function', () => {
  it('L-20: browse at 1440x900 is width-limited against the estimated stage region', () => {
    const region = estimateStageRegion({ width: 1440, height: 900 }, 'browse')
    expect(region).toEqual({ width: 1440 - STAGE_LAYOUT.browse.tocW, height: 900 - 56 - 200 })
    expect(fitScale(region, CANVAS, 'browse')).toBeCloseTo((region.width - 32) / DESIGN_W, 10)
  })

  it('L-20: present uses its own insets and maxScale for the same viewport', () => {
    const region = estimateStageRegion({ width: 1440, height: 900 }, 'present')
    expect(region).toEqual({ width: 1440, height: 900 - 56 - 96 })
    expect(fitScale(region, CANVAS, 'present')).toBeCloseTo((1440 - 48) / DESIGN_W, 10)
  })

  it('L-20: a short region is height-limited with a single factor', () => {
    const s = fitScale({ width: 1220, height: 244 }, CANVAS, 'browse')
    expect(s).toBeCloseTo((244 - 16) / DESIGN_H, 10)
    expect(s * DESIGN_W).toBeLessThan(1220 - 32)
  })

  it('L-20: a tiny or negative region clamps to MIN_SCALE', () => {
    expect(MIN_SCALE).toBe(0.25)
    expect(fitScale({ width: 300, height: -56 }, CANVAS, 'browse')).toBe(MIN_SCALE)
    expect(fitScale({ width: 0, height: 0 }, CANVAS, 'present')).toBe(MIN_SCALE)
  })

  it('L-20: a very large region clamps to each mode maxScale', () => {
    expect(fitScale({ width: 4000, height: 3000 }, CANVAS, 'present')).toBe(STAGE_LAYOUT.present.maxScale)
    expect(fitScale({ width: 4000, height: 3000 }, CANVAS, 'browse')).toBe(STAGE_LAYOUT.browse.maxScale)
  })

  it('L-20: the result is one factor inside the inset region on both axes, across a size grid', () => {
    for (const mode of ['browse', 'present'] as const) {
      const { insetX, insetY, maxScale } = STAGE_LAYOUT[mode]
      for (let w = 200; w <= 2400; w += 130) {
        for (let h = 150; h <= 1400; h += 90) {
          const s = fitScale({ width: w, height: h }, CANVAS, mode)
          expect(s).toBeGreaterThanOrEqual(MIN_SCALE)
          expect(s).toBeLessThanOrEqual(maxScale)
          if (s > MIN_SCALE && s < maxScale) {
            const fitsW = s * DESIGN_W <= w - 2 * insetX + 1e-9
            const fitsH = s * DESIGN_H <= h - 2 * insetY + 1e-9
            expect(fitsW && fitsH).toBe(true)
            const touchesOne =
              Math.abs(s * DESIGN_W - (w - 2 * insetX)) < 1e-6 || Math.abs(s * DESIGN_H - (h - 2 * insetY)) < 1e-6
            expect(touchesOne).toBe(true)
          }
        }
      }
    }
  })

  it('L-19: isWide switches at WIDE_MIN_PX (1024)', () => {
    expect(WIDE_MIN_PX).toBe(1024)
    expect(isWide(WIDE_MIN_PX - 1)).toBe(false)
    expect(isWide(WIDE_MIN_PX)).toBe(true)
  })
})

describe('L-19: default canvas and mode geometry', () => {
  it('L-19: Stage renders the canvas at 880 x 380 without a canvas override', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expect(canvasEl().style.width).toBe('880px')
    expect(canvasEl().style.height).toBe('380px')
  })

  it('L-19: the active mode selects its own fit geometry, and toggling updates the scale', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const browseExpected = fitScale(estimateStageRegion({ width: 1440, height: 900 }, 'browse'), CANVAS, 'browse')
    const presentExpected = fitScale(estimateStageRegion({ width: 1440, height: 900 }, 'present'), CANVAS, 'present')
    expect(scaleAttr()).toBeCloseTo(browseExpected, 6)
    expect(browseExpected).not.toBeCloseTo(presentExpected, 3)

    fireEvent.keyDown(document.body, { key: 'p' })
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(scaleAttr()).toBeCloseTo(presentExpected, 6)
    expect(canvasEl().style.width).toBe('880px')
  })

  it('L-19: an explicit canvas prop replaces the default canvas size', () => {
    render(<Presentation steps={steps} title="Deck" canvas={{ width: 400, height: 200 }} />)
    expect(canvasEl().style.width).toBe('400px')
    expect(canvasEl().style.height).toBe('200px')
  })
})

describe('L-20: resizing changes one uniform scale without reflowing the composition', () => {
  it('L-20: a wide resize changes the scale; canvas size and entity coordinates stay fixed', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const before = scaleAttr()
    const pos = document.querySelector('[data-testid="pos"]') as HTMLElement
    expect(pos.style.left).toBe('100px')
    expect(pos.style.top).toBe('50px')

    setViewport(1000, 700)
    const after = scaleAttr()
    expect(after).not.toBeCloseTo(before, 3)
    expect(after).toBeCloseTo((1000 - 32) / DESIGN_W, 6)
    expect(canvasEl().style.width).toBe('880px')
    expect(canvasEl().style.height).toBe('380px')
    expect(pos.style.left).toBe('100px')
    expect(pos.style.top).toBe('50px')
    expect(pos.style.width).toBe('200px')
    expect(pos.style.height).toBe('80px')
    expect(scaleInTransform()).toBeCloseTo(after, 6)
  })

  it('L-20: a short viewport is height-limited in browse', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    setViewport(1440, 500)
    expect(scaleAttr()).toBeCloseTo(0.6, 6)
    expect(scaleInTransform()).toBeCloseTo(0.6, 6)
  })

  it('L-20: a tiny viewport clamps to MIN_SCALE and a huge present viewport clamps to maxScale', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    setViewport(300, 200)
    expect(scaleAttr()).toBe(MIN_SCALE)
    setViewport(4000, 3000)
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(scaleAttr()).toBe(STAGE_LAYOUT.present.maxScale)
  })

  it('L-20: changing steps at one viewport and mode does not change the scale', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const before = scaleAttr()
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('2')
    expect(scaleAttr()).toBe(before)
  })

  it('L-20: a measured stage region drives the scale in browse and present', () => {
    mockStageMeasure(800, 300)
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(scaleAttr()).toBeCloseTo((300 - 16) / DESIGN_H, 6)
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(scaleAttr()).toBeCloseTo((300 - 32) / DESIGN_H, 6)
  })
})
