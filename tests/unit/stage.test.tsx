// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Stage } from '../../src/presentation-kit/Stage'
import { fitScale } from '../../src/presentation-kit/fit'
import type { Step } from '../../src/presentation-kit/types'

vi.mock('motion/react', () => import('./support/motionMock'))

type Payload = { label: string }
const mounts = { count: 0 }

const SceneA = ({ payload }: { payload: Payload }) => {
  useEffect(() => {
    mounts.count += 1
  }, [])
  return <div data-testid="a">{payload.label}</div>
}
const SceneB = ({ payload }: { payload: Payload }) => {
  useEffect(() => {
    mounts.count += 1
  }, [])
  return <div data-testid="b">{payload.label}</div>
}

function step(id: string, groupKey: string, scene: typeof SceneA, label: string): Step<Payload> {
  return { id, era: 'e', title: id, caption: id, groupKey, scene, payload: { label } }
}

const canvas = () => document.querySelector('[data-presentation-canvas]') as HTMLElement
const stage = () => document.querySelector('[data-presentation-stage]') as HTMLElement

function stubViewport(width: number, height: number) {
  vi.stubGlobal('innerWidth', width)
  vi.stubGlobal('innerHeight', height)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  mounts.count = 0
})

describe('persistent grouped scenes', () => {
  it('keeps one scene instance across steps that share a group and scene', () => {
    const steps = [step('one', 'g', SceneA, 'first'), step('two', 'g', SceneA, 'second')]
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    expect(mounts.count).toBe(1)
    rerender(<Stage steps={steps} index={1} mode="browse" />)
    expect(mounts.count).toBe(1)
    expect(document.querySelector('[data-testid="a"]')?.textContent).toBe('second')
  })

  it('remounts when only the group changes, and when only the scene component changes', () => {
    const steps = [
      step('one', 'g', SceneA, 'first'),
      step('two', 'g', SceneA, 'second'),
      step('three', 'other', SceneA, 'third'),
      step('four', 'other', SceneB, 'fourth'),
    ]
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    rerender(<Stage steps={steps} index={2} mode="browse" />)
    expect(mounts.count).toBe(2)
    rerender(<Stage steps={steps} index={3} mode="browse" />)
    expect(mounts.count).toBe(3)
    expect(document.querySelector('[data-testid="b"]')?.textContent).toBe('fourth')
  })

  it('accounts for StrictMode: one extra initial effect, then no remount within the group', () => {
    const steps = [step('one', 'g', SceneA, 'first'), step('two', 'g', SceneA, 'second')]
    const { rerender } = render(
      <StrictMode>
        <Stage steps={steps} index={0} mode="browse" />
      </StrictMode>,
    )
    expect(mounts.count).toBe(2)
    rerender(
      <StrictMode>
        <Stage steps={steps} index={1} mode="browse" />
      </StrictMode>,
    )
    expect(mounts.count).toBe(2)
  })

  it('does not remount an unchanged grouped scene on an idle re-render', () => {
    const steps = [step('one', 'g', SceneA, 'first'), step('two', 'g', SceneA, 'second')]
    render(<Stage steps={steps} index={0} mode="browse" />)
    const afterMount = mounts.count
    act(() => {})
    expect(mounts.count).toBe(afterMount)
  })
})

describe('fixed-canvas fit scaling', () => {
  const steps = [step('one', 'g', SceneA, 'first')]

  it('uses the default 880 x 380 canvas and one uniform scale', () => {
    stubViewport(1000, 800)
    render(<Stage steps={steps} index={0} mode="browse" />)
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
    const scale = fitScale({ width: 1000, height: 800 }, 'browse')
    expect(canvas().style.transform).toBe(`scale(${scale})`)
    expect(canvas().style.transformOrigin).toBe('0 0')
  })

  it('rescales on resize without changing canvas dimensions or entity coordinates', () => {
    stubViewport(1000, 800)
    render(<Stage steps={steps} index={0} mode="browse" />)
    const before = canvas().style.transform
    stubViewport(500, 600)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(canvas().style.transform).not.toBe(before)
    expect(canvas().style.transform).toBe(`scale(${fitScale({ width: 500, height: 600 }, 'browse')})`)
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
  })

  it('applies mode-specific fit geometry', () => {
    stubViewport(1000, 800)
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    const browse = canvas().style.transform
    rerender(<Stage steps={steps} index={0} mode="present" />)
    expect(canvas().style.transform).not.toBe(browse)
    expect(canvas().style.transform).toBe(`scale(${fitScale({ width: 1000, height: 800 }, 'present')})`)
  })

  it('keeps the same scale when a step has a longer caption, because the fit ignores step content', () => {
    stubViewport(1000, 800)
    const short = [step('one', 'g', SceneA, 'first')]
    const long = [{ ...step('one', 'g', SceneA, 'first'), caption: 'A much longer caption '.repeat(40) }]
    const { container: a, unmount } = render(<Stage steps={short} index={0} mode="browse" />)
    const shortTransform = (a.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform
    unmount()
    const { container: b } = render(<Stage steps={long} index={0} mode="browse" />)
    expect((b.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform).toBe(shortTransform)
  })

  it('fits the stage width, not the window width, when a side column narrows the stage', () => {
    stubViewport(1440, 900)
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    rect.mockImplementation(function (this: HTMLElement) {
      const width = this.hasAttribute('data-presentation-stage') ? 1206 : 0
      return { width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0, toJSON: () => ({}) }
    })
    render(<Stage steps={steps} index={0} mode="browse" />)
    const scale = fitScale({ width: 1206, height: 900 }, 'browse')
    expect(scale).toBeLessThan(fitScale({ width: 1440, height: 900 }, 'browse'))
    expect(canvas().style.transform).toBe(`scale(${scale})`)
    expect(880 * scale).toBeLessThanOrEqual(1206 - 48)
  })

  it('places the canvas centered inside the stage', () => {
    stubViewport(1000, 800)
    render(<Stage steps={steps} index={0} mode="browse" />)
    expect(stage().style.display).toBe('flex')
    expect(stage().style.alignItems).toBe('center')
    expect(stage().style.justifyContent).toBe('center')
  })
})

describe('scene component changes', () => {
  it('remounts a new scene component under the same group, keeping the old scene through its exit', () => {
    const steps = [step('one', 'g', SceneA, 'first'), step('two', 'g', SceneB, 'second')]
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    expect(mounts.count).toBe(1)
    rerender(<Stage steps={steps} index={1} mode="browse" />)
    expect(mounts.count).toBe(2)
    expect(document.querySelector('[data-testid="b"]')?.textContent).toBe('second')
  })
})
