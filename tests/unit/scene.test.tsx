// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, type ComponentType } from 'react'
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest'
import {
  Appear, Arrow, arrowPath, Box, Emphasis, ENTER_DELAY, Frame, Label, LAYOUT_T, NEWCOMER_DELAY, Presentation,
  SceneLayer, sceneKey, SymbolChip, type SceneProps, type Step,
} from '../../src/presentation-kit'
import { setViewport } from './helpers'

const q = (selector: string) => document.querySelector<HTMLElement>(selector)
const next = () => fireEvent.keyDown(document.body, { key: 'ArrowRight' })

beforeEach(() => setViewport(1280, 800))

let mounts = { A: 0, B: 0 }
beforeEach(() => (mounts = { A: 0, B: 0 }))

interface Payload {
  entities: string[]
  newcomers?: string[]
}

function makeScene(name: 'A' | 'B'): ComponentType<SceneProps<Payload>> {
  return function Scene({ payload }: SceneProps<Payload>) {
    useEffect(() => {
      mounts[name]++
    }, [])
    return (
      <SceneLayer>
        {payload.entities.map((id) =>
          payload.newcomers?.includes(id) ? (
            <Appear key={id}><Box id={`ns/${id}`}>{id}</Box></Appear>
          ) : (
            <Box key={id} id={`ns/${id}`}>{id}</Box>
          ),
        )}
      </SceneLayer>
    )
  }
}
const SceneA = makeScene('A')
const SceneB = makeScene('B')

const step = (id: string, payload: Payload, extra: Partial<Step<Payload>> = {}): Step<Payload> => ({
  id, era: 'era', title: id, caption: `${id} caption`, Scene: SceneA, payload, ...extra,
})

describe('grouped scenes', () => {
  it('equal group and Scene update one instance in place', () => {
    const steps = [
      step('1', { entities: ['x'] }, { groupKey: 'g' }),
      step('2', { entities: ['x', 'y'], newcomers: ['y'] }, { groupKey: 'g' }),
    ]
    render(<Presentation steps={steps} title="T" />)
    const before = q('[data-presentation-entity="ns/x"]')
    expect(mounts.A).toBe(1)
    next()
    expect(mounts.A).toBe(1)
    expect(q('[data-presentation-entity="ns/x"]')).toBe(before)
    expect(q('[data-presentation-entity="ns/y"]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })

  it('changing only the group, or only the Scene, mounts a new instance and cross-fades', async () => {
    const steps = [
      step('1', { entities: ['x'] }, { groupKey: 'g' }),
      step('2', { entities: ['x'] }, { groupKey: 'h' }),
      step('3', { entities: ['x'] }, { groupKey: 'h', Scene: SceneB }),
      step('4', { entities: ['x'] }, { groupKey: 'g' }),
    ]
    expect(sceneKey(steps[0])).not.toBe(sceneKey(steps[1]))
    expect(sceneKey(steps[1])).not.toBe(sceneKey(steps[2]))
    expect(sceneKey(steps[0])).toBe(sceneKey(steps[3]))
    render(<Presentation steps={steps} title="T" />)
    next()
    expect(mounts.A).toBe(2)
    expect(document.querySelectorAll('[data-presentation-scene]').length).toBeGreaterThan(1) // cross-fade in progress
    next()
    expect(mounts).toEqual({ A: 2, B: 1 })
    const settled = () => waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1), { timeout: 3000 })
    await settled()
    next()
    expect(mounts.A).toBe(3) // returning to a prior group after an intervening one remounts
    await settled()
  })

  it('without a groupKey every step is its own scene', () => {
    const a = step('1', { entities: [] })
    const b = step('2', { entities: [] })
    expect(sceneKey(a)).not.toBe(sceneKey(b))
  })
})

describe('entering, continuing and departing entities', () => {
  it('wraps only newcomers in Appear, delayed until persisting entities have settled', () => {
    const steps = [
      step('1', { entities: ['x'] }, { groupKey: 'g' }),
      step('2', { entities: ['x', 'y'], newcomers: ['y'] }, { groupKey: 'g' }),
      step('3', { entities: ['x', 'y', 'z'], newcomers: ['y', 'z'] }, { groupKey: 'g' }),
    ]
    render(<Presentation steps={steps} title="T" />)
    next()
    const x = q('[data-presentation-entity="ns/x"]')!
    const y = q('[data-presentation-entity="ns/y"]')!
    expect(x.closest('[data-presentation-appear]')).toBeNull()
    const wrapper = y.closest('[data-presentation-appear]')!
    expect(Number(wrapper.getAttribute('data-presentation-appear-delay'))).toBeCloseTo(LAYOUT_T + ENTER_DELAY)
    expect(NEWCOMER_DELAY).toBeCloseTo(LAYOUT_T + ENTER_DELAY)
    next()
    // continuing entities keep their node and are not re-faded: same wrapper, same delay, not re-initialised
    expect(q('[data-presentation-entity="ns/y"]')).toBe(y)
    expect(y.closest('[data-presentation-appear]')).toBe(wrapper)
    expect(q('[data-presentation-entity="ns/x"]')).toBe(x)
    expect(x.closest('[data-presentation-appear]')).toBeNull()
  })

  it('Appear accepts a custom delay', () => {
    render(<Appear delay={0}><span /></Appear>)
    expect(q('[data-presentation-appear]')!.getAttribute('data-presentation-appear-delay')).toBe('0')
  })

  it('departing entities stay mounted while they exit, then are removed, in a persistent scene', async () => {
    const steps = [
      step('1', { entities: ['x', 'gone'], newcomers: ['gone'] }, { groupKey: 'g' }),
      step('2', { entities: ['x'] }, { groupKey: 'g' }),
    ]
    render(<Presentation steps={steps} title="T" />)
    const gone = q('[data-presentation-entity="ns/gone"]')!
    next()
    expect(gone.isConnected).toBe(true) // exit animation still pending
    expect(q('[data-presentation-entity="ns/x"]')).not.toBeNull()
    await waitFor(() => expect(gone.isConnected).toBe(false), { timeout: 3000 })
  })

  it('departing entities also exit when the whole scene is swapped', async () => {
    const steps = [step('1', { entities: ['x'] }, { groupKey: 'g' }), step('2', { entities: ['y'] }, { groupKey: 'h' })]
    render(<Presentation steps={steps} title="T" />)
    const x = q('[data-presentation-entity="ns/x"]')!
    next()
    expect(x.isConnected).toBe(true)
    await waitFor(() => expect(x.isConnected).toBe(false), { timeout: 3000 })
  })
})

describe('primitives', () => {
  it('expose stable entity/node hooks and pass through className, style and data attributes', () => {
    render(
      <SceneLayer>
        <Box key="b" id="e/box" className="c" style={{ gap: 3 }} data-extra="1" at={{ x: 10, y: 20, w: 30, h: 40 }}>b</Box>
        <Label key="l" id="e/label" at={{ x: 1, y: 2 }}>l</Label>
        <Frame key="f" id="e/frame" className="f" />
        <Emphasis key="m" id="e/emphasis" />
        <SymbolChip key="s" id="e/chip" Icon={Check}>c</SymbolChip>
        <Arrow key="a" id="e/arrow" from={[0, 0]} to={[10, 10]} className="a" />
      </SceneLayer>,
    )
    const nodes: Record<string, string> = { 'e/box': 'box', 'e/label': 'label', 'e/frame': 'frame', 'e/emphasis': 'emphasis', 'e/chip': 'symbol-chip', 'e/arrow': 'arrow' }
    for (const [id, node] of Object.entries(nodes)) {
      expect(q(`[data-presentation-entity="${id}"]`)!.getAttribute('data-presentation-node')).toBe(node)
    }
    const box = q('[data-presentation-entity="e/box"]')!
    expect(box).toHaveClass('c')
    expect(box.getAttribute('data-extra')).toBe('1')
    expect(box.style.position).toBe('absolute')
    expect([box.style.left, box.style.top, box.style.width, box.style.height]).toEqual(['10px', '20px', '30px', '40px'])
    expect(box.style.gap).toBe('3px')
    expect(q('[data-presentation-entity="e/frame"]')).toHaveClass('f')
    expect(q('[data-presentation-entity="e/arrow"]')).toHaveClass('a')
    expect(q('[data-presentation-scene-layer]')!.style.position).toBe('absolute')
  })

  it('Box and SymbolChip render an optional Lucide glyph component', () => {
    render(
      <>
        <Box id="g/with" Icon={Check}>x</Box>
        <Box id="g/without">y</Box>
        <SymbolChip id="g/chip" Icon={Check} />
      </>,
    )
    expect(q('[data-presentation-entity="g/with"] [data-presentation-glyph]')).not.toBeNull()
    expect(q('[data-presentation-entity="g/without"] [data-presentation-glyph]')).toBeNull()
    expect(q('[data-presentation-entity="g/chip"] [data-presentation-glyph]')).not.toBeNull()
    expect(q('[data-presentation-entity="g/with"]')!.getAttribute('data-presentation-entity')).toBe('g/with')
  })

  it('emit no colour, font, border, shadow or radius of their own', () => {
    render(
      <>
        <Box id="s/box">b</Box>
        <Label id="s/l">l</Label>
        <Frame id="s/f" />
        <Emphasis id="s/e" />
        <SymbolChip id="s/c">c</SymbolChip>
        <Arrow id="s/a" from={[0, 0]} to={[5, 5]} />
      </>,
    )
    const forbidden = /color|background|font|border|shadow|outline|radius|padding|margin|fill|stroke-width/i
    document.querySelectorAll<HTMLElement>('[data-presentation-entity]').forEach((el) => {
      expect(el.getAttribute('style') ?? '').not.toMatch(forbidden)
    })
  })

  it('Arrow draws a two-way path between its endpoints and supports bending', () => {
    const { container } = render(<Arrow id="a/1" from={[0, 10]} to={[100, 10]} twoWay />)
    const path = container.querySelector('path[d]:not([d^="M 0 0 L"])')!
    expect(path.getAttribute('marker-end')).toMatch(/^url\(#a_1-head\)$/)
    expect(path.getAttribute('marker-start')).toMatch(/^url\(#a_1-head\)$/)
    expect(arrowPath([0, 10], [100, 10])).toBe('M 0 10 Q 50 10 100 10')
    expect(arrowPath([0, 0], [100, 0], 20)).toBe('M 0 0 Q 50 20 100 0')
    expect(render(<Arrow id="a/2" from={[0, 0]} to={[5, 5]} />).container.querySelector('[marker-start]')).toBeNull()
  })

  it('a raw motion element with a layoutId and literal coordinates works inside the stage', () => {
    const Raw: Step<undefined>['Scene'] = () => (
      <SceneLayer>
        <motion.div key="r" layoutId="raw/1" data-presentation-entity="raw/1" style={{ position: 'absolute', left: 12, top: 34 }} />
      </SceneLayer>
    )
    render(<Presentation steps={[{ id: 'r', era: 'e', title: 't', caption: 'c', Scene: Raw, payload: undefined }]} title="T" />)
    expect(q('[data-presentation-entity="raw/1"]')!.style.left).toBe('12px')
  })
})

describe('kit stays topic-agnostic', () => {
  it('renders an unrelated entity namespace and payload through the same host', () => {
    const Other: ComponentType<SceneProps<{ words: string[] }>> = ({ payload }) => (
      <SceneLayer>{payload.words.map((w) => <Label key={w} id={`other/${w}`}>{w}</Label>)}</SceneLayer>
    )
    render(<Presentation steps={[{ id: 'o', era: 'x', title: 'Other', caption: 'c', Scene: Other, payload: { words: ['alpha', 'beta'] } }]} title="T" />)
    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(q('[data-presentation-entity="other/beta"]')).not.toBeNull()
  })
})

describe('typed payloads', () => {
  it('flow through <Presentation> without casts and reject a mismatched payload', () => {
    interface P { n: number }
    const Typed: ComponentType<SceneProps<P>> = ({ payload }) => <span>{payload.n}</span>
    const good: Step<P>[] = [{ id: 'a', era: 'e', title: 't', caption: 'c', Scene: Typed, payload: { n: 42 } }]
    const bad = [{ id: 'a', era: 'e', title: 't', caption: 'c', Scene: Typed, payload: { n: 'one' } }]
    render(<Presentation steps={good} title="T" />)
    expect(screen.getByText('42')).toBeInTheDocument()
    // @ts-expect-error a payload that does not match the Scene's props is rejected at the boundary
    const rejected = <Presentation steps={bad} title="T" />
    void rejected
    expectTypeOf(good[0].payload).toEqualTypeOf<P>()
    expectTypeOf<SceneProps<P>['payload']>().toEqualTypeOf<P>()
    // @ts-expect-error steps require every narration field
    const missing: Step<P> = { id: 'a', era: 'e', title: 't', Scene: Typed, payload: { n: 1 } }
    void missing
  })
})
