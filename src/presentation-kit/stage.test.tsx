import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Exit and enter transitions run in real time; allow for parallel test load.
vi.setConfig({ testTimeout: 20000 })
import { cleanup, render, waitFor } from '@testing-library/react'
import { useEffect, type ComponentType } from 'react'
import { Stage } from './Stage'
import { Entity } from './nodes/Entity'
import { Appear } from './nodes/Appear'
import { SceneLayer } from './nodes/SceneLayer'
import { EXIT_T } from './constants'
import type { SceneProps, Step, StepMeta } from './types'

// Records motion element props and LayoutGroup ids so layoutId, layout, exit and shared-layout wiring
// can be asserted. jsdom cannot measure projection; these tests check wiring and presence timing.
const captured = vi.hoisted(() => ({
  motion: [] as Array<{ tag: string; props: Record<string, unknown> }>,
  layoutGroups: [] as string[],
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const React = await import('react')
  const cache = new Map<string, unknown>()
  const motion = new Proxy(actual.motion, {
    get(target, tag) {
      if (typeof tag !== 'string') return Reflect.get(target, tag)
      if (!cache.has(tag)) {
        const Real = Reflect.get(target, tag) as React.ElementType
        cache.set(
          tag,
          React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
            captured.motion.push({ tag, props })
            return React.createElement(Real, { ...props, ref })
          }),
        )
      }
      return cache.get(tag)
    },
  })
  const LayoutGroup = (props: { id?: string; children?: React.ReactNode }) => {
    captured.layoutGroups.push(props.id ?? '')
    return React.createElement(actual.LayoutGroup, props, props.children)
  }
  return { ...actual, motion, LayoutGroup }
})

afterEach(cleanup)
beforeEach(() => {
  captured.motion.length = 0
  captured.layoutGroups.length = 0
})

interface Payload {
  x: number
  y: number
  w: number
  h: number
  label: string
  flag?: boolean
  fresh?: boolean
  old?: boolean
}

interface Counter {
  mounts: number
}

/** A scene whose mount count is observable. `card` persists; `fresh` is newcomer-only; `old` is departing-only. */
function makeScene(counter: Counter, cardIdFor: (p: Payload) => string = () => 'card'): ComponentType<SceneProps<Payload>> {
  return function CountingScene({ payload }) {
    useEffect(() => {
      counter.mounts += 1
    }, [])
    return (
      <>
        <Entity id={cardIdFor(payload)} x={payload.x} y={payload.y} w={payload.w} h={payload.h} emphasis={payload.flag}>
          {payload.label}
        </Entity>
        <Appear when={payload.fresh === true}>
          <Entity id="fresh" x={0} y={0} w={50} h={50} />
        </Appear>
        <Appear when={payload.old === true}>
          <Entity id="old" x={0} y={200} w={50} h={50} />
        </Appear>
      </>
    )
  }
}

const meta = (id: string): StepMeta => ({ id, era: 'era', title: `T ${id}`, caption: `C ${id}` })

function stepOf(
  id: string,
  Scene: ComponentType<SceneProps<Payload>>,
  payload: Payload,
  groupKey?: string,
): Step<Payload> {
  return { ...meta(id), groupKey, Scene, payload }
}

const cardA: Payload = { x: 10, y: 20, w: 100, h: 50, label: 'A', old: true }
const cardB: Payload = { x: 300, y: 120, w: 200, h: 80, label: 'B', flag: true, fresh: true }

function entity(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-presentation-entity="${id}"]`)
}

function lastMotion(entityId: string): Record<string, unknown> | undefined {
  return captured.motion.filter((c) => c.props['data-presentation-entity'] === entityId).at(-1)?.props
}

/** Resolves with the ms after `start` at which `node` leaves `container`. */
function removalTime(container: HTMLElement, node: Element, start: number): Promise<number> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!container.contains(node)) {
        observer.disconnect()
        resolve(performance.now() - start)
      }
    })
    observer.observe(container, { childList: true, subtree: true })
  })
}

describe('same group, same Scene: one instance updates in place (L-4, L-6)', () => {
  it('keeps the scene instance and the continuing node, updates values, and mounts newcomers', () => {
    const counter = { mounts: 0 }
    const Scene = makeScene(counter)
    const { container, rerender } = render(<Stage step={stepOf('a', Scene, cardA, 'g')} index={0} mode="present" />)
    expect(counter.mounts).toBe(1)
    const card = entity(container, 'card')
    expect(card).not.toBeNull()
    rerender(<Stage step={stepOf('b', Scene, cardB, 'g')} index={1} mode="present" />)

    expect(counter.mounts).toBe(1)
    expect(entity(container, 'card')).toBe(card)
    const el = entity(container, 'card') as HTMLElement
    expect(el.style.left).toBe('300px')
    expect(el.style.top).toBe('120px')
    expect(el.style.width).toBe('200px')
    expect(el.style.height).toBe('80px')
    expect(el.textContent).toBe('B')
    expect(el.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(lastMotion('card')?.layoutId).toBe('card')
  })

  it('mounts a newcomer through Appear and keeps continuing entities free of Appear wrappers', () => {
    const counter = { mounts: 0 }
    const Scene = makeScene(counter)
    const { container, rerender } = render(<Stage step={stepOf('a', Scene, { ...cardA, old: false }, 'g')} index={0} mode="present" />)
    rerender(<Stage step={stepOf('b', Scene, cardB, 'g')} index={1} mode="present" />)
    const fresh = entity(container, 'fresh')
    expect(fresh).not.toBeNull()
    expect(fresh?.closest('[data-presentation-appear]')).not.toBeNull()
    expect(entity(container, 'card')?.closest('[data-presentation-appear]')).toBeNull()
    const appearProps = captured.motion.filter((c) => c.props['data-presentation-appear'] !== undefined).map((c) => c.props)
    expect(appearProps.at(-1)?.initial).toEqual({ opacity: 0 })
    expect(lastMotion('card')?.initial).toBeUndefined()
  })

  it('a departing entity stays present after navigation and is removed only after its exit completes', async () => {
    const counter = { mounts: 0 }
    const Scene = makeScene(counter)
    const { container, rerender } = render(<Stage step={stepOf('a', Scene, cardA, 'g')} index={0} mode="present" />)
    const old = entity(container, 'old') as HTMLElement
    expect(old).not.toBeNull()
    // Let the departing entity finish entering first; an exit from opacity 0 has nothing to animate.
    await waitFor(() => expect((old.closest('[data-presentation-appear]') as HTMLElement).style.opacity).toBe('1'), {
      timeout: 5000,
    })
    const start = performance.now()
    const removed = removalTime(container, old, start)
    rerender(<Stage step={stepOf('b', Scene, { ...cardB, fresh: false, old: false }, 'g')} index={1} mode="present" />)
    expect(container.contains(old)).toBe(true)
    const elapsed = await removed
    expect(counter.mounts).toBe(1)
    expect(elapsed).toBeGreaterThanOrEqual(EXIT_T * 1000 - 30)
    expect(
      captured.motion.some(
        (c) =>
          c.props['data-presentation-appear'] !== undefined &&
          (c.props.exit as { transition?: { duration?: number } } | undefined)?.transition?.duration === EXIT_T,
      ),
    ).toBe(true)
  })

  it('forward and back within the group keeps one mount and identical root and continuing nodes', () => {
    const counter = { mounts: 0 }
    const Scene = makeScene(counter)
    const { container, rerender } = render(<Stage step={stepOf('a', Scene, cardA, 'g')} index={0} mode="present" />)
    const root = container.querySelector('[data-presentation-scene="g"]')
    const card = entity(container, 'card')
    rerender(<Stage step={stepOf('b', Scene, cardB, 'g')} index={1} mode="present" />)
    rerender(<Stage step={stepOf('a', Scene, cardA, 'g')} index={0} mode="present" />)
    expect(counter.mounts).toBe(1)
    expect(container.querySelector('[data-presentation-scene="g"]')).toBe(root)
    expect(entity(container, 'card')).toBe(card)
    expect((entity(container, 'card') as HTMLElement).textContent).toBe('A')
  })

  it('overlapping entities keep authored geometry and stacking order across steps', () => {
    const counter = { mounts: 0 }
    const Overlap: ComponentType<SceneProps<{ tag: string }>> = ({ payload }) => {
      useEffect(() => {
        counter.mounts += 1
      }, [])
      return (
        <>
          <Entity id="back" x={0} y={0} w={200} h={200} data-tag={payload.tag} />
          <Entity id="front" x={50} y={50} w={100} h={100} />
        </>
      )
    }
    const step = (id: string, tag: string): Step<{ tag: string }> => ({ ...meta(id), groupKey: 'ov', Scene: Overlap, payload: { tag } })
    const { container, rerender } = render(<Stage step={step('a', 'one')} index={0} mode="present" />)
    const snapshot = () => ['back', 'front'].map((id) => {
      const el = entity(container, id) as HTMLElement
      return { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height }
    })
    const before = snapshot()
    const order = (): boolean => {
      const back = entity(container, 'back') as HTMLElement
      const front = entity(container, 'front') as HTMLElement
      return (back.compareDocumentPosition(front) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    }
    expect(order()).toBe(true)
    rerender(<Stage step={step('b', 'two')} index={1} mode="present" />)
    expect(counter.mounts).toBe(1)
    expect(snapshot()).toEqual(before)
    expect(order()).toBe(true)
    expect(before).toEqual([
      { left: '0px', top: '0px', width: '200px', height: '200px' },
      { left: '50px', top: '50px', width: '100px', height: '100px' },
    ])
  })
})

describe('changed grouping takes the presence-transition path (L-4, L-6)', () => {
  it('same groupKey with a different Scene mounts a new instance and keeps the old scene until exit', async () => {
    const countA = { mounts: 0 }
    const countB = { mounts: 0 }
    const SceneA = makeScene(countA, () => 'card-a')
    const SceneB = makeScene(countB, () => 'card-b')
    const { container, rerender } = render(<Stage step={stepOf('a', SceneA, cardA, 'g')} index={0} mode="present" />)
    const oldRoot = container.querySelector('[data-presentation-scene="g"]') as HTMLElement
    const start = performance.now()
    const removed = removalTime(container, oldRoot, start)
    rerender(<Stage step={stepOf('b', SceneB, cardB, 'g')} index={1} mode="present" />)
    expect(container.contains(oldRoot)).toBe(true)
    expect(countB.mounts).toBe(1)
    expect(countA.mounts).toBe(1)
    const elapsed = await removed
    expect(elapsed).toBeGreaterThanOrEqual(EXIT_T * 1000 - 30)
    expect(container.querySelector('[data-presentation-scene="g"]')).not.toBe(oldRoot)
  })

  it('same Scene with a different groupKey mounts a new instance and keeps the old scene until exit', async () => {
    const counter = { mounts: 0 }
    // The continuing entity id follows the payload, so the two sides do not share a layoutId and the exit is not held.
    const Scene = makeScene(counter, (p) => `card-${p.label}`)
    const { container, rerender } = render(<Stage step={stepOf('a', Scene, cardA, 'g1')} index={0} mode="present" />)
    const oldRoot = container.querySelector('[data-presentation-scene="g1"]') as HTMLElement
    const start = performance.now()
    const removed = removalTime(container, oldRoot, start)
    rerender(<Stage step={stepOf('b', Scene, { ...cardB, fresh: false }, 'g2')} index={1} mode="present" />)
    expect(container.contains(oldRoot)).toBe(true)
    expect(counter.mounts).toBe(2)
    expect(container.querySelector('[data-presentation-scene="g2"]')).not.toBeNull()
    expect(await removed).toBeGreaterThanOrEqual(EXIT_T * 1000 - 30)
  })

  it('different groups switch by group identity and share one layoutId inside one LayoutGroup', async () => {
    const countA = { mounts: 0 }
    const countB = { mounts: 0 }
    const SceneA = makeScene(countA)
    const SceneB = makeScene(countB)
    const { container, rerender } = render(<Stage step={stepOf('a', SceneA, cardA, 'g1')} index={0} mode="present" />)
    const oldRoot = container.querySelector('[data-presentation-scene="g1"]') as HTMLElement
    const oldCard = entity(container, 'card')
    rerender(<Stage step={stepOf('b', SceneB, { ...cardB, fresh: false }, 'g2')} index={1} mode="present" />)
    // Stage switches by group identity: the new group is mounted and the old group is still present (exiting).
    const newRoot = container.querySelector('[data-presentation-scene="g2"]') as HTMLElement
    expect(newRoot).not.toBeNull()
    expect(newRoot).not.toBe(oldRoot)
    expect(container.contains(oldRoot)).toBe(true)
    expect(countB.mounts).toBe(1)
    // Both sides carry the same layoutId (the morph pairs them) under one LayoutGroup. The two scene DOM nodes are not required to match.
    // Completion is not timed here: in jsdom a shared layoutId keeps the exiting scene mounted (no layout projection),
    // so removal timing is asserted with distinct ids in the group-change tests above.
    const layoutIds = captured.motion
      .filter((c) => c.props['data-presentation-entity'] === 'card')
      .map((c) => c.props.layoutId)
    expect(new Set(layoutIds)).toEqual(new Set(['card']))
    expect(lastMotion('card')?.layout).toBe(true)
    expect(new Set(captured.layoutGroups)).toEqual(new Set(['presentation-stage']))
    expect(entity(newRoot, 'card')).not.toBeNull()
    expect(entity(newRoot, 'card')).not.toBe(oldCard)
    expect(oldRoot.querySelector('[data-presentation-entity="card"]')).toBe(oldCard)
    expect(countA.mounts).toBe(1)
  })
})

describe('coexisting raw layers do not reflow each other (C-4)', () => {
  it('mounting a second SceneLayer leaves the first layer geometry unchanged and every wrapper absolutely positioned', () => {
    const meta1: StepMeta = meta('layers')
    const Layers: ComponentType<SceneProps<{ count: number }>> = ({ payload }) => (
      <>
        <SceneLayer className="layer-1">
          <span>one</span>
        </SceneLayer>
        {payload.count > 1 ? (
          <SceneLayer className="layer-2">
            <span>two</span>
          </SceneLayer>
        ) : null}
      </>
    )
    const step = (count: number): Step<{ count: number }> => ({ ...meta1, groupKey: 'layers', Scene: Layers, payload: { count } })
    const { container, rerender } = render(<Stage step={step(1)} index={0} mode="present" />)
    const layer1 = container.querySelector('.layer-1') as HTMLElement
    const before = layer1.getAttribute('style')
    rerender(<Stage step={step(2)} index={0} mode="present" />)
    const layer2 = container.querySelector('.layer-2') as HTMLElement
    expect(layer2).not.toBeNull()
    expect(layer1.getAttribute('style')).toBe(before)
    expect(layer1.style.position).toBe('absolute')
    expect(layer2.style.position).toBe('absolute')

    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.position).toBe('absolute')
    // Every element between each layer and the canvas is absolutely positioned, so nothing flows.
    for (const layer of [layer1, layer2]) {
      let node = layer.parentElement
      while (node && node !== canvas) {
        expect(node.style.position, `${node.tagName} wrapper`).toBe('absolute')
        node = node.parentElement
      }
      expect(node).toBe(canvas)
    }
  })
})
