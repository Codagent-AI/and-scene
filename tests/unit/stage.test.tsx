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

function stubStageSize(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const isStage = this.hasAttribute('data-presentation-stage')
    return {
      width: isStage ? width : 0,
      height: isStage ? height : 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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
    stubStageSize(1000, 600)
    render(<Stage steps={steps} index={0} mode="browse" />)
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
    const scale = fitScale({ width: 1000, height: 600 }, 'browse')
    expect(canvas().style.transform).toBe(`scale(${scale})`)
    expect(canvas().style.transformOrigin).toBe('0 0')
  })

  it('rescales on resize without changing canvas dimensions or entity coordinates', () => {
    stubStageSize(1000, 600)
    render(<Stage steps={steps} index={0} mode="browse" />)
    const before = canvas().style.transform
    stubStageSize(500, 400)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(canvas().style.transform).not.toBe(before)
    expect(canvas().style.transform).toBe(`scale(${fitScale({ width: 500, height: 400 }, 'browse')})`)
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
  })

  it('applies mode-specific fit geometry', () => {
    stubStageSize(1000, 600)
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    const browse = canvas().style.transform
    rerender(<Stage steps={steps} index={0} mode="present" />)
    expect(canvas().style.transform).not.toBe(browse)
    expect(canvas().style.transform).toBe(`scale(${fitScale({ width: 1000, height: 600 }, 'present')})`)
  })

  it('places the canvas centered inside the stage', () => {
    render(<Stage steps={steps} index={0} mode="browse" />)
    expect(stage().style.display).toBe('flex')
    expect(stage().style.alignItems).toBe('center')
    expect(stage().style.justifyContent).toBe('center')
  })
})
