import { StrictMode, useEffect, useState, type ComponentType } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { motion } from 'motion/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Appear, Arrow, Box, ENTER_DELAY, ENTER_T, EXIT_T, Emphasis, Frame, LAYOUT_T, Label, Presentation, SceneLayer,
  SymbolChip, appearMotion, sceneKey, type SceneProps, type Step,
} from '../../src/presentation-kit'
import { callsFor, liveMounts, motionCalls, resetMotionSpy, totalMounts } from '../helpers/motionSpy'

vi.mock('motion/react', async () => (await import('../helpers/motionSpy')).createMotionMock())

interface Payload {
  ids: string[]
  /** Overrides for x per entity id. */
  x?: Record<string, number>
  label?: string
}

const life = { live: 0, total: 0, instances: 0 }

function makeScene(name: string): ComponentType<SceneProps<Payload>> {
  return function NamedScene({ payload }) {
    const [instance] = useState(() => ++life.instances)
    const [clicks, setClicks] = useState(0)
    useEffect(() => {
      life.live++
      life.total++
      return () => {
        life.live--
      }
    }, [])
    return (
      <SceneLayer data-scene-name={name} data-instance={instance}>
        <button data-sentinel="" onClick={() => setClicks((c) => c + 1)}>{clicks}</button>
        {payload.ids.map((id, i) => (
          <Box key={id} id={id} x={payload.x?.[id] ?? i * 100} y={i * 10} w={50} h={20} label={`${id}${payload.label ?? ''}`} />
        ))}
      </SceneLayer>
    )
  }
}
const SceneA = makeScene('A')
const SceneB = makeScene('B')

const step = (id: string, p: Payload, over: Partial<Step<Payload>> = {}): Step<Payload> => ({
  id, era: 'E', title: id, caption: id, Scene: SceneA, groupKey: 'g', payload: p, ...over,
})

const key = (k: string) => fireEvent.keyDown(window, { key: k })
const scenes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-presentation-scene]'))
const layer = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-layer]')!
const entity = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)
const stepIndex = (c: HTMLElement) => c.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')
const settled = (c: HTMLElement) => waitFor(() => expect(scenes(c)).toHaveLength(1), { timeout: 2000 })

function mountDeck(steps: Array<Step<Payload>>, strict = false) {
  const tree = <Presentation steps={steps} title="Deck" />
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

beforeEach(() => {
  resetMotionSpy()
  life.live = life.total = life.instances = 0
})

describe('I-4 persisting entities keep identity and morph in place', () => {
  const primitives = [
    ['Box', Box], ['Label', Label], ['Frame', Frame], ['Emphasis', Emphasis], ['SymbolChip', SymbolChip],
  ] as const

  it.each(primitives)('%s: stable id reaches layoutId and the entity hook; layout projection enabled', (_n, Prim) => {
    const { container } = render(<Prim id="e1" x={1} y={2} />)
    expect(entity(container, 'e1')).not.toBeNull()
    const call = callsFor('e1').at(-1)!
    expect(call.props.layoutId).toBe('e1')
    expect(call.props.layout).toBe(true)
    expect((call.props.transition as { layout: { duration: number } }).layout.duration).toBe(LAYOUT_T)
  })

  it.each(primitives)('%s: changed geometry and label reach the same DOM node', (_n, Prim) => {
    const { container, rerender } = render(<Prim id="e1" x={1} y={2} w={3} h={4} label="old" />)
    const node = entity(container, 'e1')!
    rerender(<Prim id="e1" x={50} y={60} w={70} h={80} label="new" emphasis />)
    expect(entity(container, 'e1')).toBe(node)
    expect([node.style.left, node.style.top, node.style.width, node.style.height]).toEqual(['50px', '60px', '70px', '80px'])
    expect(node.textContent).toBe('new')
    expect(node.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(totalMounts.get('e1')).toBe(1)
  })

  it('Arrow: stable entity hook, endpoints animate in place with the layout duration', () => {
    const { container, rerender } = render(<Arrow id="ar" from={[0, 0]} to={[10, 10]} />)
    const node = entity(container, 'ar')!
    rerender(<Arrow id="ar" from={[5, 5]} to={[90, 40]} />)
    expect(entity(container, 'ar')).toBe(node)
    expect(totalMounts.get('ar')).toBe(1)
    const lines = motionCalls.filter((c) => c.tag === 'line')
    const last = lines.at(-1)!.props
    expect(last.animate).toEqual({ x1: 5, y1: 5, x2: 90, y2: 40 })
    expect((last.transition as { duration: number }).duration).toBe(LAYOUT_T)
  })

  it('sample-style flow: a continuing entity in a grouped scene is the same node with updated content', async () => {
    const { container } = mountDeck([step('s1', { ids: ['a'] }), step('s2', { ids: ['a'], x: { a: 300 }, label: '!' })])
    const a = entity(container, 'a')!
    key('ArrowRight')
    await settled(container)
    expect(entity(container, 'a')).toBe(a)
    expect(a.style.left).toBe('300px')
    expect(a.textContent).toBe('a!')
  })

  it('Stage renders scene entities inside the LayoutGroup and the SceneLayer AnimatePresence', () => {
    const { container } = mountDeck([step('s1', { ids: ['a'] })])
    const a = entity(container, 'a')!
    expect(a.closest('[data-test-layoutgroup]')).not.toBeNull()
    expect(a.closest('[data-presentation-canvas]')!.contains(a.closest('[data-test-layoutgroup]'))).toBe(true)
    expect(layer(container).firstElementChild!.hasAttribute('data-test-presence')).toBe(true)
    expect(layer(container).firstElementChild!.contains(a)).toBe(true)
  })
})

describe('I-5 newcomer enters after layout settles', () => {
  it('appearMotion delays entry by ENTER_DELAY >= LAYOUT_T with a real ENTER_T transition', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
    expect(appearMotion.initial).toEqual({ opacity: 0 })
    expect(appearMotion.animate.opacity).toBe(1)
    expect(appearMotion.animate.transition.delay).toBe(ENTER_DELAY)
    expect(appearMotion.animate.transition.duration).toBe(ENTER_T)
  })

  it('Appear passes that motion to the element and starts transparent', () => {
    const { container } = render(<Appear>x</Appear>)
    const props = motionCalls.find((c) => 'data-presentation-appear' in c.props)!.props
    expect(props.initial).toEqual(appearMotion.initial)
    expect(props.animate).toEqual(appearMotion.animate)
    expect(container.querySelector<HTMLElement>('[data-presentation-appear]')!.style.opacity).toBe('0')
  })

  it('persisting entities really use LAYOUT_T for layout, and every primitive uses the shared newcomer motion', () => {
    render(<><Box id="b" x={0} y={0} /><Arrow id="ar" from={[0, 0]} to={[1, 1]} /></>)
    const box = callsFor('b').at(-1)!.props
    expect((box.transition as { layout: { duration: number } }).layout.duration).toBe(LAYOUT_T)
    for (const call of [box, callsFor('ar').at(-1)!.props]) {
      expect(call.animate).toEqual(appearMotion.animate)
      expect(call.initial).toEqual(appearMotion.initial)
    }
  })
})

describe('I-6 departing entity animates out', () => {
  it('grouped child removal: kept in DOM through exit inside AnimatePresence, then removed; scene not remounted', async () => {
    const { container } = mountDeck([step('s1', { ids: ['a', 'b'] }), step('s2', { ids: ['a'] })])
    const b = entity(container, 'b')!
    expect(b.closest('[data-test-presence]')).not.toBeNull()
    key('ArrowRight')
    expect(entity(container, 'b')).toBe(b) // still present while exiting
    const exit = callsFor('b').at(-1)!.props.exit as { opacity: number; transition: { duration: number } }
    expect(exit.opacity).toBe(0)
    expect(exit.transition.duration).toBe(EXIT_T)
    await waitFor(() => expect(entity(container, 'b')).toBeNull(), { timeout: 2000 })
    expect(entity(container, 'a')).not.toBeNull()
    expect(life.total).toBe(1)
  })

  it('ungrouped scene replacement: old scene exits (both present briefly) and is then removed', async () => {
    const { container } = mountDeck([
      step('s1', { ids: ['a'] }, { groupKey: undefined }),
      step('s2', { ids: ['z'] }, { groupKey: undefined }),
    ])
    const old = scenes(container)[0]!
    key('ArrowRight')
    expect(scenes(container)).toHaveLength(2)
    expect(scenes(container)).toContain(old)
    await settled(container)
    expect(scenes(container)[0]).not.toBe(old)
    expect(entity(container, 'z')).not.toBeNull()
    expect(entity(container, 'a')).toBeNull()
  })

  it('stage-level scene exit uses EXIT_T', () => {
    const { container } = mountDeck([step('s1', { ids: ['a'] })])
    const call = motionCalls.find((c) => 'data-presentation-scene' in c.props)!.props
    expect((call.exit as { transition: { duration: number } }).transition.duration).toBe(EXIT_T)
    expect(scenes(container)).toHaveLength(1)
  })
})

describe('I-7 grouped scenes keep one instance', () => {
  const grouped = [
    step('s1', { ids: ['a'] }),
    step('s2', { ids: ['a', 'b'] }),
    step('s3', { ids: ['b'] }),
  ]

  it('same group + same Scene: one mount, retained local state, new payload, both directions', async () => {
    const { container } = mountDeck(grouped)
    const sentinel = () => container.querySelector<HTMLElement>('[data-sentinel]')!
    fireEvent.click(sentinel())
    fireEvent.click(sentinel())
    const instance = layer(container).getAttribute('data-instance')
    const walk = ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft']
    const expectedIds = [['a', 'b'], ['b'], ['a', 'b'], ['a']]
    for (const [i, k] of walk.entries()) {
      key(k)
      await settled(container)
      await waitFor(() => {
        const ids = Array.from(container.querySelectorAll('[data-presentation-entity]')).map((e) => e.getAttribute('data-presentation-entity'))
        expect(ids).toEqual(expectedIds[i])
      }, { timeout: 2000 })
      expect(layer(container).getAttribute('data-instance')).toBe(instance)
      expect(sentinel().textContent).toBe('2')
    }
    expect(life.total).toBe(1)
    expect(life.instances).toBe(1)
  })

  it('direct jump within a group also keeps the instance', async () => {
    const { container } = mountDeck(grouped)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[2]!)
    await settled(container)
    expect(stepIndex(container)).toBe('2')
    expect(life.total).toBe(1)
  })

  it('different group, same Scene: replaced by a new instance', async () => {
    const { container } = mountDeck([step('s1', { ids: ['a'] }), step('s2', { ids: ['a'] }, { groupKey: 'other' })])
    key('ArrowRight')
    expect(scenes(container)).toHaveLength(2)
    await settled(container)
    expect(life.total).toBe(2)
    expect(life.instances).toBe(2)
  })

  it('same group, different Scene: replaced by a new instance', async () => {
    const { container } = mountDeck([step('s1', { ids: ['a'] }), step('s2', { ids: ['a'] }, { Scene: SceneB })])
    key('ArrowRight')
    await settled(container)
    expect(life.total).toBe(2)
    expect(layer(container).getAttribute('data-scene-name')).toBe('B')
  })

  it('sceneKey: identical for group+Scene, distinct for either difference, unique per ungrouped step', () => {
    const base = step('s1', { ids: [] })
    expect(sceneKey(base)).toBe(sceneKey(step('s2', { ids: ['x'] })))
    expect(sceneKey(base)).not.toBe(sceneKey(step('s2', { ids: [] }, { groupKey: 'h' })))
    expect(sceneKey(base)).not.toBe(sceneKey(step('s2', { ids: [] }, { Scene: SceneB })))
    expect(sceneKey(step('u1', { ids: [] }, { groupKey: undefined }))).not.toBe(
      sceneKey(step('u2', { ids: [] }, { groupKey: undefined })),
    )
  })
})

describe('I-8 continuing entities do not replay the newcomer fade', () => {
  it('keeps node identity and mount count across forward, backward and direct updates; newcomers enter transparent', async () => {
    const steps = [
      step('s1', { ids: ['a'] }),
      step('s2', { ids: ['a', 'c'], x: { a: 200 } }),
      step('s3', { ids: ['a', 'c', 'd'], x: { a: 400 }, label: '2' }),
    ]
    const { container } = mountDeck(steps)
    const a = entity(container, 'a')!
    await waitFor(() => expect(a.style.opacity).toBe('1'), { timeout: 3000 })

    key('ArrowRight')
    const c = entity(container, 'c')!
    expect(c.style.opacity).toBe('0') // the newcomer starts hidden...
    expect(entity(container, 'a')).toBe(a)
    expect(a.style.opacity).toBe('1') // ...the continuing entity does not
    expect(a.style.left).toBe('200px')

    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[2]!)
    expect(entity(container, 'a')).toBe(a)
    expect(a.style.opacity).toBe('1')
    expect(a.textContent).toBe('a2')
    expect(entity(container, 'd')!.style.opacity).toBe('0')

    key('ArrowLeft')
    key('ArrowLeft')
    await settled(container)
    expect(entity(container, 'a')).toBe(a)
    expect(a.style.opacity).toBe('1')
    expect(a.style.left).toBe('0px')
    expect(totalMounts.get('a')).toBe(1)
    expect(totalMounts.get('c')).toBe(1) // exits, never remounts
    expect(life.total).toBe(1)
  })

  it('a re-added entity enters again as a newcomer', async () => {
    const { container } = mountDeck([step('s1', { ids: ['a'] }), step('s2', { ids: ['a', 'n'] })])
    key('ArrowRight')
    expect(entity(container, 'n')!.style.opacity).toBe('0')
    expect(totalMounts.get('n')).toBe(1)
  })
})

describe('I-9 intentional overlap and stacking survive updates', () => {
  const Overlap: ComponentType<SceneProps<{ extra: boolean; x: number }>> = ({ payload }) => (
    <>
      <SceneLayer key="back" data-layer="back" style={{ zIndex: 1 }}>
        <Box id="big" x={payload.x} y={20} w={300} h={200} />
      </SceneLayer>
      <SceneLayer key="front" data-layer="front" style={{ zIndex: 2 }}>
        <Box id="small" x={150} y={80} w={100} h={50} style={{ zIndex: 5 }} />
      </SceneLayer>
      {payload.extra ? (
        <SceneLayer key="extra" data-layer="extra">
          <Box id="extra" x={0} y={0} w={10} h={10} />
        </SceneLayer>
      ) : null}
    </>
  )
  const mk = (id: string, p: { extra: boolean; x: number }): Step<{ extra: boolean; x: number }> => ({
    id, era: 'E', title: id, caption: id, Scene: Overlap, groupKey: 'g', payload: p,
  })

  it('keeps supplied coordinates, z-order and layer geometry when a layer mounts or payload changes', async () => {
    const { container } = render(<Presentation steps={[mk('s1', { extra: false, x: 100 }), mk('s2', { extra: true, x: 120 }), mk('s3', { extra: true, x: 100 })]} title="t" />)
    const snap = (name: string) => {
      const l = container.querySelector<HTMLElement>(`[data-layer="${name}"]`)!
      return [l.style.position, l.style.left, l.style.top, l.style.width, l.style.height, l.style.zIndex]
    }
    const before = { back: snap('back'), front: snap('front') }
    expect(before.back.slice(0, 5)).toEqual(['absolute', '0px', '0px', '880px', '380px'])
    const small = entity(container, 'small')!
    const smallBefore = [small.style.left, small.style.top, small.style.width, small.style.height, small.style.zIndex]
    expect(smallBefore).toEqual(['150px', '80px', '100px', '50px', '5'])

    key('ArrowRight')
    await settled(container)
    expect(container.querySelector('[data-layer="extra"]')).not.toBeNull()
    expect({ back: snap('back'), front: snap('front') }).toEqual(before)
    expect([small.style.left, small.style.top, small.style.width, small.style.height, small.style.zIndex]).toEqual(smallBefore)
    expect(entity(container, 'big')!.style.left).toBe('120px')
    const order = Array.from(container.querySelectorAll('[data-layer]')).map((l) => l.getAttribute('data-layer'))
    expect(order).toEqual(['back', 'front', 'extra'])
    // Overlapping boxes were not spread apart: big (100..400) still covers small (150..250).
    expect(Number.parseInt(entity(container, 'big')!.style.left)).toBeLessThanOrEqual(150)
  })
})

describe('I-13 coordinate-heavy scenes with primitive hooks and raw motion elements', () => {
  const Raw: ComponentType<SceneProps<{ left: number; top: number }>> = ({ payload }) => (
    <SceneLayer>
      <motion.div key="raw" layoutId="raw" data-raw="" style={{ position: 'absolute', left: payload.left, top: payload.top, width: 40, height: 40 }} />
      <Box key="prim" id="prim" x={payload.left} y={payload.top} className="lit" style={{ width: 123, height: 45 }} />
    </SceneLayer>
  )
  const mk = (id: string, left: number, top: number): Step<{ left: number; top: number }> => ({
    id, era: 'E', title: id, caption: id, Scene: Raw, groupKey: 'g', payload: { left, top },
  })

  it('updates geometry, keeps the supplied layoutId and layout-group ancestry, forces no styling', async () => {
    const { container } = render(<Presentation steps={[mk('s1', 10, 20), mk('s2', 300, 200)]} title="t" />)
    const raw = container.querySelector<HTMLElement>('[data-raw]')!
    const prim = entity(container, 'prim')!
    expect([raw.style.left, raw.style.top, prim.style.width, prim.style.height, prim.className]).toEqual(['10px', '20px', '123px', '45px', 'lit'])

    key('ArrowRight')
    await settled(container)
    expect(container.querySelector('[data-raw]')).toBe(raw)
    expect([raw.style.left, raw.style.top, prim.style.left, prim.style.top]).toEqual(['300px', '200px', '300px', '200px'])
    const rawCalls = motionCalls.filter((c) => 'data-raw' in c.props)
    expect(new Set(rawCalls.map((c) => c.props.layoutId))).toEqual(new Set(['raw']))
    expect(totalMounts.get('raw')).toBe(1)
    expect(raw.closest('[data-test-layoutgroup]')).not.toBeNull()
    expect(raw.closest('[data-presentation-layer]')).not.toBeNull()
    const styled = Array.from({ length: raw.style.length }, (_, i) => raw.style[i])
    expect(styled.filter((p) => /color|font|border|shadow|background/.test(p!))).toEqual([])
  })
})

describe('X-2 StrictMode', () => {
  it('double-invoked lifecycle leaves one live entity and one live scene; no duplicated DOM', () => {
    const { container } = mountDeck([step('s1', { ids: ['a', 'b'] })], true)
    for (const id of ['a', 'b']) {
      expect(container.querySelectorAll(`[data-presentation-entity="${id}"]`)).toHaveLength(1)
      expect(liveMounts.get(id)).toBe(1)
    }
    expect(scenes(container)).toHaveLength(1)
    expect(life.live).toBe(1)
    expect(container.querySelectorAll('[data-presentation-root]')).toHaveLength(1)
  })

  it('one key press advances exactly one step, mode toggles once, and same-group updates add no remount', async () => {
    const { container } = mountDeck(
      [step('s1', { ids: ['a'] }), step('s2', { ids: ['a', 'b'] }), step('s3', { ids: ['a', 'b'], x: { a: 9 } })],
      true,
    )
    const totalAfterInit = life.total
    const aTotalAfterInit = totalMounts.get('a')
    key('ArrowRight')
    expect(stepIndex(container)).toBe('1')
    key('PageDown')
    expect(stepIndex(container)).toBe('2')
    key('ArrowLeft')
    expect(stepIndex(container)).toBe('1')
    key('p')
    expect(container.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('present')
    await settled(container)
    expect(life.total).toBe(totalAfterInit)
    expect(totalMounts.get('a')).toBe(aTotalAfterInit)
    expect(life.live).toBe(1)
    expect(liveMounts.get('a')).toBe(1)
    expect(liveMounts.get('b')).toBe(1)
  })

  it('removes every window listener it added when unmounted', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount, container } = mountDeck([step('s1', { ids: ['a'] }), step('s2', { ids: ['a'] })], true)
    unmount()
    const live = (spy: typeof add, type: string) => spy.mock.calls.filter((c) => c[0] === type).length
    for (const type of ['keydown', 'touchstart', 'touchend', 'resize']) {
      expect(live(remove, type), type).toBe(live(add, type))
    }
    expect(() => act(() => { key('ArrowRight') })).not.toThrow()
    expect(container.querySelector('[data-presentation-root]')).toBeNull()
    add.mockRestore()
    remove.mockRestore()
  })
})
