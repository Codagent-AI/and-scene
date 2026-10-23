// @vitest-environment jsdom
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { MotionGlobalConfig, motion } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Box, Label, SceneLayer } from '../index'
import { Presentation } from '../Presentation'
import { stageKey } from '../stageKey'
import { Stage } from '../Stage'
import type { Step, SceneProps } from '../types'
import { fitScale } from '../useFitScale'

const counts = vi.hoisted(() => ({ a: 0, b: 0 }))

interface Entities {
  entities: string[]
  label?: string
}

const LayerScene = ({ payload }: SceneProps<Entities>) => (
  <div data-testid="scene-root">
    <SceneLayer name="diagram">
      {payload.entities.map((id) => (
        <Box key={id} data-testid={`entity-${id}`} data-presentation-entity={id} style={{ left: 10, top: 10, width: 50, height: 20 }}>
          <Label>{id}</Label>
        </Box>
      ))}
    </SceneLayer>
  </div>
)

function CountingA({ payload }: SceneProps<Entities>) {
  useEffect(() => {
    counts.a += 1
  }, [])
  return <div data-testid="scene-root">{payload.label}</div>
}
function CountingB({ payload }: SceneProps<Entities>) {
  useEffect(() => {
    counts.b += 1
  }, [])
  return <div data-testid="scene-root">{payload.label}</div>
}

const step = (id: string, extra: Partial<Step<Entities>>): Step<Entities> => ({
  id,
  era: 'one',
  title: id,
  caption: id,
  Scene: LayerScene,
  payload: { entities: [], label: id },
  ...extra,
})

const nextButton = (container: HTMLElement) => container.querySelector('[data-presentation-control="next"]') as HTMLElement
const sceneRoot = (container: HTMLElement) => container.querySelector('[data-testid="scene-root"]') as HTMLElement

beforeEach(() => {
  counts.a = 0
  counts.b = 0
})

afterEach(() => {
  MotionGlobalConfig.skipAnimations = false
  vi.unstubAllGlobals()
})

describe('grouped scenes', () => {
  it('keeps one scene instance when adjacent steps share a group and scene', () => {
    const steps = [
      step('s1', { groupKey: 'g', Scene: CountingA, payload: { entities: [], label: 'one' } }),
      step('s2', { groupKey: 'g', Scene: CountingA, payload: { entities: [], label: 'two' } }),
    ]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const before = sceneRoot(view.container)
    fireEvent.click(nextButton(view.container))
    expect(sceneRoot(view.container)).toBe(before)
    expect(before.textContent).toBe('two')
    expect(counts.a).toBe(1)
  })

  it('mounts a new instance when the group key changes', async () => {
    const steps = [
      step('s1', { groupKey: 'g', Scene: CountingA, payload: { entities: [], label: 'one' } }),
      step('s2', { groupKey: 'h', Scene: CountingA, payload: { entities: [], label: 'two' } }),
    ]
    MotionGlobalConfig.skipAnimations = true
    const view = render(<Presentation steps={steps} title="Deck" />)
    const before = sceneRoot(view.container)
    fireEvent.click(nextButton(view.container))
    await waitFor(() => expect(view.container.querySelectorAll('[data-testid="scene-root"]')).toHaveLength(1))
    expect(sceneRoot(view.container)).not.toBe(before)
    expect(sceneRoot(view.container).textContent).toBe('two')
  })

  it('mounts a new instance when the scene component changes within one group', async () => {
    const steps = [
      step('s1', { groupKey: 'g', Scene: CountingA, payload: { entities: [], label: 'one' } }),
      step('s2', { groupKey: 'g', Scene: CountingB, payload: { entities: [], label: 'two' } }),
    ]
    MotionGlobalConfig.skipAnimations = true
    const view = render(<Presentation steps={steps} title="Deck" />)
    const before = sceneRoot(view.container)
    fireEvent.click(nextButton(view.container))
    await waitFor(() => expect(view.container.querySelectorAll('[data-testid="scene-root"]')).toHaveLength(1))
    expect(sceneRoot(view.container)).not.toBe(before)
    expect(counts.b).toBe(1)
  })

  it('gives different keys to ungrouped steps and to different scenes in one group', () => {
    const ungrouped = step('s1', {})
    const other = step('s2', {})
    expect(stageKey(ungrouped)).not.toBe(stageKey(other))
    const grouped = step('s3', { groupKey: 'g', Scene: CountingA })
    const sameGroupOtherScene = step('s4', { groupKey: 'g', Scene: CountingB })
    expect(stageKey(grouped)).not.toBe(stageKey(sameGroupOtherScene))
    expect(stageKey(grouped)).toBe(stageKey({ ...grouped, id: 'other' }))
  })

  it('keeps authored coordinates, z-order, and overlap through grouped updates', () => {
    const Overlap = ({ payload }: SceneProps<Entities>) => (
      <div data-testid="scene-root">
        <SceneLayer name="diagram">
          <Box data-testid="under" data-presentation-entity="under" style={{ left: 100, top: 50, width: 120, height: 60, zIndex: 1 }}>
            under
          </Box>
          <Box data-testid="over" data-presentation-entity="over" style={{ left: 130, top: 60, width: 120, height: 60, zIndex: 2 }}>
            {payload.label}
          </Box>
        </SceneLayer>
      </div>
    )
    const steps = [
      step('s1', { groupKey: 'g', Scene: Overlap, payload: { entities: [], label: 'one' } }),
      step('s2', { groupKey: 'g', Scene: Overlap, payload: { entities: [], label: 'two' } }),
    ]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const read = () => {
      const over = view.getByTestId('over')
      return [over.style.left, over.style.top, over.style.zIndex, view.getByTestId('under').style.left]
    }
    const before = read()
    fireEvent.click(nextButton(view.container))
    expect(read()).toEqual(before)
    expect(before).toEqual(['130px', '60px', '2', '100px'])
  })
})

describe('departing entities', () => {
  it('keeps the same scale for different steps in one mode and changes it when the mode changes', () => {
    class ResizeObserverStub {
      callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    const steps = [step('s1', { groupKey: 'g', payload: { entities: [] } }), step('s2', { groupKey: 'g', payload: { entities: [] } })]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const stage = view.container.querySelector<HTMLElement>('[data-presentation-stage]')!
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 1000 })
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 400 })
    const transform = () => view.container.querySelector<HTMLElement>('[data-presentation-canvas-inner]')!.style.transform
    const resize = () =>
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })
    resize()
    const browse = transform()
    fireEvent.click(nextButton(view.container))
    resize()
    expect(transform()).toBe(browse)
    fireEvent.keyDown(window, { key: 'p' })
    resize()
    expect(transform()).not.toBe(browse)
    vi.unstubAllGlobals()
  })

  it('keeps a dropped entity mounted while its exit is pending', () => {
    MotionGlobalConfig.skipAnimations = false
    const steps = [
      step('s1', { groupKey: 'g', payload: { entities: ['keep', 'gone'] } }),
      step('s2', { groupKey: 'g', payload: { entities: ['keep'] } }),
    ]
    const view = render(<Presentation steps={steps} title="Deck" />)
    expect(view.getByTestId('entity-gone')).toBeTruthy()
    fireEvent.click(nextButton(view.container))
    expect(view.container.querySelector('[data-testid="entity-gone"]')).not.toBeNull()
    expect(view.getByTestId('entity-keep')).toBeTruthy()
  })

  it('removes the dropped entity once its exit completes', async () => {
    MotionGlobalConfig.skipAnimations = true
    const steps = [
      step('s1', { groupKey: 'g', payload: { entities: ['keep', 'gone'] } }),
      step('s2', { groupKey: 'g', payload: { entities: ['keep'] } }),
    ]
    const view = render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(nextButton(view.container))
    await waitFor(() => expect(view.container.querySelector('[data-testid="entity-gone"]')).toBeNull())
    expect(view.getByTestId('entity-keep')).toBeTruthy()
  })
})

describe('layers and mode changes', () => {
  it('mounts a second layer without remounting or moving the first', () => {
    const Layers = ({ payload }: SceneProps<Entities>) => (
      <div data-testid="scene-root">
        <SceneLayer name="base">
          <Box data-testid="base-box" style={{ left: 20, top: 30, width: 40, height: 40 }}>base</Box>
        </SceneLayer>
        {payload.entities.includes('top') ? (
          <SceneLayer name="top">
            <Box data-testid="top-box" style={{ left: 500, top: 100, width: 40, height: 40 }}>top</Box>
          </SceneLayer>
        ) : null}
      </div>
    )
    const steps = [
      step('s1', { groupKey: 'g', Scene: Layers, payload: { entities: [] } }),
      step('s2', { groupKey: 'g', Scene: Layers, payload: { entities: ['top'] } }),
    ]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const base = view.getByTestId('base-box')
    const baseLayer = base.parentElement
    fireEvent.click(nextButton(view.container))
    expect(view.getByTestId('base-box')).toBe(base)
    expect(view.getByTestId('base-box').parentElement).toBe(baseLayer)
    expect(base.style.left).toBe('20px')
    expect(view.getByTestId('top-box').parentElement?.getAttribute('data-presentation-layer')).toBe('top')
    expect(baseLayer?.style.position).toBe('absolute')
  })

  it('switches fit geometry on mode toggle without remounting the scene', () => {
    const steps = [step('s1', { groupKey: 'g', payload: { entities: ['keep'] } })]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const scene = view.container.querySelector('[data-presentation-scene]')
    fireEvent.keyDown(window, { key: 'p' })
    expect(view.container.querySelector('[data-presentation-scene]')).toBe(scene)
  })
})

describe('coordinate-heavy raw motion composition', () => {
  it('passes a raw motion element with a stable layoutId and literal coordinates through unchanged', () => {
    const Raw = () => (
      <SceneLayer name="raw">
        <motion.div
          data-testid="raw-node"
          layoutId="presentation:raw:node"
          layout
          style={{ position: 'absolute', left: 123, top: 45, width: 60, height: 30 }}
        />
      </SceneLayer>
    )
    const steps = [step('s1', { groupKey: 'g', Scene: Raw, payload: { entities: [] } })]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const node = view.getByTestId('raw-node')
    expect(node.style.left).toBe('123px')
    expect(node.style.top).toBe('45px')
    expect(node.style.width).toBe('60px')
  })
})

describe('fit scaling', () => {
  it('scales the fixed canvas by one transform, recalculated on resize, without changing its internal size', () => {
    class FakeResizeObserver {
      static last: FakeResizeObserver | undefined
      callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
        FakeResizeObserver.last = this
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const steps = [step('s1', { groupKey: 'g', payload: { entities: [] } })]
    const view = render(<Stage step={steps[0]!} mode="browse" />)
    const stage = view.container.querySelector<HTMLElement>('[data-presentation-stage]')!
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 1200 })
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 600 })
    act(() => FakeResizeObserver.last!.callback())
    const inner = view.container.querySelector<HTMLElement>('[data-presentation-canvas-inner]')!
    expect(inner.style.transform).toBe(`scale(${fitScale({ width: 1200, height: 600 }, 'browse')})`)
    expect(inner.style.width).toBe('880px')
    expect(inner.style.height).toBe('380px')
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 400 })
    act(() => FakeResizeObserver.last!.callback())
    expect(inner.style.transform).not.toBe(`scale(${fitScale({ width: 1200, height: 600 }, 'browse')})`)
    expect(inner.style.width).toBe('880px')
  })
})
