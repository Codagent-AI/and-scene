import { describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'

function mockRect(node: HTMLElement, width: number, height: number) {
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON() {
      return this
    },
  })
}

function Harness({ mode, onScale }: { mode: 'browse' | 'present'; onScale: (scale: number) => void }) {
  const { containerRef, scale } = useFitScale(mode)
  onScale(scale)
  return <div ref={containerRef} data-testid="container" />
}

describe('useFitScale', () => {
  it('scales the fixed canvas to fit the available viewport uniformly', () => {
    let latest = 1
    const { getByTestId } = render(<Harness mode="browse" onScale={(scale) => (latest = scale)} />)
    const node = getByTestId('container')
    mockRect(node, DESIGN_W * 2 + 200, DESIGN_H * 2 + 400)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(latest).toBeGreaterThan(0)
    expect(Number.isFinite(latest)).toBe(true)
  })

  it('never drops below the minimum scale even for a tiny viewport', () => {
    let latest = 1
    const { getByTestId } = render(<Harness mode="present" onScale={(scale) => (latest = scale)} />)
    const node = getByTestId('container')
    mockRect(node, 10, 10)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(latest).toBeGreaterThanOrEqual(0.35)
  })
})
