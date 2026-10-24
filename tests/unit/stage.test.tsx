// @vitest-environment jsdom
import { StrictMode, useEffect, useState } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Appear,
  DESIGN_H,
  DESIGN_W,
  Presentation,
  SceneLayer,
  Stage,
  computeFitScale,
  type SceneProps,
  type Step,
} from '../../src/presentation-kit/index.ts'
import { mockViewport } from '../support/fixtures.tsx'

const log: string[] = []
let nextInstance = 0

/** Records mounts/unmounts and keeps instance-local state so remounts are observable. */
function CounterScene({ payload, step }: SceneProps<{ n: number }>) {
  const [instance] = useState(() => ++nextInstance)
  useEffect(() => {
    log.push(`mount:${instance}`)
    return () => void log.push(`unmount:${instance}`)
  }, [instance])
  return <div data-testid="scene" data-instance={instance} data-n={payload.n} data-step={step.id} />
}

function OtherScene(props: SceneProps<{ n: number }>) {
  return <CounterScene {...props} />
}

const step = (id: string, Scene: Step<{ n: number }>['Scene'], groupKey?: string, n = 0): Step<{ n: number }> => ({
  id, era: 'e', title: id, caption: id, groupKey, Scene, payload: { n },
})

const instances = () => Array.from(document.querySelectorAll('[data-testid="scene"]')).map((e) => e.getAttribute('data-instance'))
const lastScene = () => Array.from(document.querySelectorAll('[data-testid="scene"]')).at(-1) as HTMLElement
const next = () => fireEvent.keyDown(document.body, { key: 'ArrowRight' })

describe('persistent grouped scenes (M-07)', () => {
  it('updates payload in place within a group and swaps instances across groups or Scene components', () => {
    mockViewport(1280, 800)
    log.length = 0
    const steps = [
      step('a', CounterScene, 'g1', 1),
      step('b', CounterScene, 'g1', 2),
      step('c', CounterScene, 'g1', 3),
      step('d', CounterScene, 'g2', 4),
      step('e', OtherScene, 'g2', 5),
    ]
    render(
      <StrictMode>
        <Presentation steps={steps} />
      </StrictMode>,
    )
    const first = lastScene().getAttribute('data-instance')
    const baseline = log.filter((l) => l.startsWith('mount')).length // StrictMode may mount twice
    next()
    next()
    expect(instances()).toEqual([first]) // same single instance, no cross-fade copy
    expect(lastScene().getAttribute('data-n')).toBe('3')
    expect(lastScene().getAttribute('data-step')).toBe('c')
    expect(log.filter((l) => l.startsWith('mount')).length).toBe(baseline)

    next() // new group key
    expect(lastScene().getAttribute('data-instance')).not.toBe(first)
    expect(lastScene().getAttribute('data-n')).toBe('4')
    const afterGroup = lastScene().getAttribute('data-instance')

    next() // same group, different Scene component
    expect(lastScene().getAttribute('data-instance')).not.toBe(afterGroup)
    expect(lastScene().getAttribute('data-step')).toBe('e')
  })

  it('keeps ungrouped steps as separate instances', () => {
    mockViewport(1280, 800)
    render(<Presentation steps={[step('a', CounterScene), step('b', CounterScene)]} />)
    const first = lastScene().getAttribute('data-instance')
    next()
    expect(lastScene().getAttribute('data-instance')).not.toBe(first)
  })
})

describe('Stage fit scaling (M-26, M-27, C-07)', () => {
  const canvas = () => document.querySelector('[data-presentation-canvas]') as HTMLElement
  const scaleOf = () => Number(/scale\(([\d.]+)\)/.exec(canvas().style.transform)![1])

  it('renders a fixed 880 x 380 canvas with a single uniform scale transform', () => {
    mockViewport(1280, 800)
    render(<Stage step={step('a', CounterScene)} index={0} mode="browse" />)
    expect([canvas().style.width, canvas().style.height]).toEqual([`${DESIGN_W}px`, `${DESIGN_H}px`])
    expect(canvas().style.transform.match(/scale\(/g)).toHaveLength(1)
    expect(scaleOf()).toBeCloseTo(computeFitScale(1280, 800, 'browse'))
  })

  it('honours a custom canvas and recomputes on real resize and ResizeObserver callbacks', () => {
    mockViewport(1000, 600)
    const callbacks: (() => void)[] = []
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          callbacks.push(cb)
        }
        observe() {}
        disconnect = disconnect
      },
    )
    const { unmount } = render(<Stage step={step('a', CounterScene)} index={0} mode="browse" canvas={{ width: 440, height: 190 }} />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['440px', '190px'])
    const before = scaleOf()
    expect(before).toBeCloseTo(computeFitScale(1000, 600, 'browse', 440, 190))
    mockViewport(500, 600) // width shrinks, height unchanged
    act(() => callbacks[0]())
    expect(scaleOf()).toBeCloseTo(computeFitScale(500, 600, 'browse', 440, 190))
    mockViewport(500, 150)
    act(() => void window.dispatchEvent(new Event('resize')))
    expect(scaleOf()).toBeCloseTo(computeFitScale(500, 150, 'browse', 440, 190))
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(remove.mock.calls.map((c) => c[0])).toContain('resize')
    vi.unstubAllGlobals()
  })

  it('keeps scale stable across steps and changes it only when the mode changes, without remounting the scene', () => {
    mockViewport(1280, 800)
    const steps = [step('a', CounterScene, 'g', 1), step('b', CounterScene, 'g', 9)]
    render(<Presentation steps={steps} />)
    const scale = scaleOf()
    const instance = lastScene().getAttribute('data-instance')
    next()
    expect(scaleOf()).toBe(scale)
    expect(lastScene().getAttribute('data-instance')).toBe(instance)
    fireEvent.click(document.querySelector('[data-presentation-mode-toggle]')!)
    expect(scaleOf()).toBeCloseTo(computeFitScale(1280, 800, 'present'))
    expect(scaleOf()).not.toBe(scale)
    expect(lastScene().getAttribute('data-instance')).toBe(instance)
    expect(lastScene().getAttribute('data-n')).toBe('9')
  })
})

describe('exit and enter timing (M-05, M-06)', () => {
  const Layer = ({ show }: { show: boolean }) => (
    <SceneLayer>
      {show ? (
        <Appear key="x">
          <span data-testid="ent">x</span>
        </Appear>
      ) : null}
    </SceneLayer>
  )

  it('keeps a departing entity mounted while it animates out, then removes it on completion', async () => {
    const view = render(<Layer show />)
    expect(document.querySelector('[data-testid="ent"]')).not.toBeNull()
    view.rerender(<Layer show={false} />)
    expect(document.querySelector('[data-testid="ent"]')).not.toBeNull() // still exiting
    await waitFor(() => expect(document.querySelector('[data-testid="ent"]')).toBeNull(), { timeout: 3000 })
  })

  it('holds a newcomer invisible until the enter delay has elapsed', async () => {
    const view = render(<Layer show />)
    const wrapper = view.container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).toBe('0')
    await new Promise((r) => setTimeout(r, 250))
    expect(Number(wrapper.style.opacity)).toBe(0) // layout morph (and its delay) still running
  })
})
