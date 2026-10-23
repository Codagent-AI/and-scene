// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode, useRef } from 'react'
import { DESIGN_W, STAGE_LAYOUT } from '../constants'
import { fitScale, useFitScale } from '../useFitScale'

type ResizeCallback = () => void

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  observed: Element[] = []
  disconnected = false
  callback: ResizeCallback
  constructor(callback: ResizeCallback) {
    this.callback = callback
    FakeResizeObserver.instances.push(this)
  }
  observe(element: Element) {
    this.observed.push(element)
  }
  disconnect() {
    this.disconnected = true
  }
}

function Probe({ mode, onScale }: { mode: 'browse' | 'present'; onScale: (scale: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref, mode)
  onScale(scale)
  return <div ref={ref} data-testid="box" />
}

afterEach(() => {
  FakeResizeObserver.instances = []
  vi.unstubAllGlobals()
})

describe('useFitScale', () => {
  it('recomputes on resize and disconnects its observer on unmount', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const scales: number[] = []
    const view = render(<Probe mode="browse" onScale={(s) => scales.push(s)} />)
    const box = view.getByTestId('box')
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 1200 })
    Object.defineProperty(box, 'clientHeight', { configurable: true, value: 500 })
    act(() => FakeResizeObserver.instances[0]!.callback())
    expect(scales.at(-1)).toBeCloseTo(fitScale({ width: 1200, height: 500 }, 'browse'))
    expect(FakeResizeObserver.instances[0]!.observed).toEqual([box])
    view.unmount()
    expect(FakeResizeObserver.instances[0]!.disconnected).toBe(true)
  })

  it('falls back to window resize events when ResizeObserver is missing', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const scales: number[] = []
    const view = render(<Probe mode="present" onScale={(s) => scales.push(s)} />)
    const box = view.getByTestId('box')
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 600 })
    Object.defineProperty(box, 'clientHeight', { configurable: true, value: 300 })
    act(() => window.dispatchEvent(new Event('resize')))
    expect(scales.at(-1)).toBeCloseTo(fitScale({ width: 600, height: 300 }, 'present'))
    expect(STAGE_LAYOUT.present.padX).toBeLessThan(STAGE_LAYOUT.browse.padX)
    expect(DESIGN_W).toBe(880)
    view.unmount()
  })
})

describe('useFitScale under StrictMode', () => {
  it('keeps one live observer after double mounting and disconnects every observer on unmount', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const view = render(
      <StrictMode>
        <Probe mode="browse" onScale={() => {}} />
      </StrictMode>,
    )
    const live = FakeResizeObserver.instances.filter((observer) => !observer.disconnected)
    expect(live).toHaveLength(1)
    view.unmount()
    expect(FakeResizeObserver.instances.every((observer) => observer.disconnected)).toBe(true)
  })
})

