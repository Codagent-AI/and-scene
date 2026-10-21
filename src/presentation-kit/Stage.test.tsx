// @vitest-environment jsdom
import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setViewport } from '../../tests/helpers/events.ts'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import { Stage } from './Stage.tsx'
import type { SceneProps, Step } from './types.ts'

interface P {
  label: string
}

const log = { mounts: 0, unmounts: 0 }

function Counting({ payload }: SceneProps<P>) {
  const [local] = useState(() => Math.random())
  useEffect(() => {
    log.mounts++
    return () => {
      log.unmounts++
    }
  }, [])
  return <div data-testid="counting" data-local={local}>{payload.label}</div>
}

function Other({ payload }: SceneProps<P>) {
  return <div data-testid="other">{payload.label}</div>
}

const step = (id: string, Scene: Step<P>['Scene'], groupKey: string | undefined, label: string): Step<P> => ({
  id, era: 'e', title: id, caption: id, Scene, groupKey, payload: { label },
})

function mount(initial: Step<P>, wrapper?: (children: ReactNode) => ReactNode) {
  log.mounts = 0
  log.unmounts = 0
  const tree = (s: Step<P>) => {
    const stage = <Stage step={s} index={0} mode="browse" scale={1} />
    return wrapper ? wrapper(stage) : stage
  }
  const view = render(tree(initial))
  return { view, go: (s: Step<P>) => view.rerender(tree(s)) }
}

describe('sceneKey', () => {
  it('is shared only by the same scene component and group', () => {
    const a = step('a', Counting, 'g', '1')
    expect(sceneKey(a)).toBe(sceneKey(step('b', Counting, 'g', '2')))
    expect(sceneKey(a)).not.toBe(sceneKey(step('c', Counting, 'h', '2')))
    expect(sceneKey(a)).not.toBe(sceneKey(step('d', Other, 'g', '2')))
    expect(sceneKey(step('x', Counting, undefined, '1'))).not.toBe(sceneKey(step('y', Counting, undefined, '1')))
  })

  it('never lets a group name collide with an ungrouped step id', () => {
    expect(sceneKey(step('b', Counting, 'step:a', '1'))).not.toBe(sceneKey(step('a', Counting, undefined, '1')))
  })

  it('remounts between a group named like an ungrouped id and that ungrouped step', () => {
    const { go } = mount(step('b', Counting, 'step:a', 'one'))
    go(step('a', Counting, undefined, 'two'))
    expect(log.mounts).toBe(2)
  })
})

describe('Stage scene lifecycle', () => {
  it('keeps the scene instance and updates only the payload for grouped steps', () => {
    const { go } = mount(step('a', Counting, 'g', 'one'))
    const node = screen.getByTestId('counting')
    const local = node.getAttribute('data-local')
    go(step('b', Counting, 'g', 'two'))
    expect(screen.getAllByTestId('counting')).toHaveLength(1)
    expect(screen.getByTestId('counting')).toBe(node)
    expect(node.getAttribute('data-local')).toBe(local)
    expect(node.textContent).toBe('two')
    expect(log).toEqual({ mounts: 1, unmounts: 0 })
  })

  it('still counts one mount for grouped steps under StrictMode (baseline after replay)', () => {
    const { go } = mount(step('a', Counting, 'g', 'one'), (children) => <StrictMode>{children}</StrictMode>)
    const baseline = log.mounts
    go(step('b', Counting, 'g', 'two'))
    expect(log.mounts).toBe(baseline)
  })

  it('remounts when the group changes with the same scene component', () => {
    const { go } = mount(step('a', Counting, 'g', 'one'))
    go(step('b', Counting, 'h', 'two'))
    expect(log.mounts).toBe(2)
    expect(screen.getAllByTestId('counting').map((n) => n.textContent)).toContain('two')
  })

  it('remounts when the scene component changes within the same group', () => {
    const { go } = mount(step('a', Counting, 'g', 'one'))
    go(step('b', Other, 'g', 'two'))
    expect(screen.getByTestId('other').textContent).toBe('two')
    expect(log.mounts).toBe(1)
  })

  it('cross-fades: the incoming scene starts transparent and the outgoing one fades out', () => {
    const { go } = mount(step('a', Other, 'g1', 'one'))
    go(step('b', Other, 'g2', 'two'))
    const scenes = [...document.querySelectorAll('[data-presentation-scene]')] as HTMLElement[]
    expect(scenes).toHaveLength(2)
    expect(scenes.every((s) => s.style.position === 'absolute')).toBe(true)
    expect(scenes.some((s) => s.style.opacity === '0')).toBe(true)
  })
})

describe('Stage geometry', () => {
  it('keeps a fixed canvas and applies one uniform scale', () => {
    setViewport(1440, 900)
    mount(step('a', Other, 'g', 'one'))
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([canvas.style.width, canvas.style.height]).toEqual([`${DESIGN_W}px`, `${DESIGN_H}px`])
    expect(canvas.style.transform).toBe('scale(1)')
  })

  it('does not rescale between steps at a fixed viewport', () => {
    const { go } = mount(step('a', Other, 'g', 'one'))
    const before = (document.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform
    go(step('b', Other, 'g', 'two'))
    expect((document.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform).toBe(before)
  })
})
