import type { ReactElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { motion } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import { Appear } from './nodes/Appear'
import { Arrow } from './nodes/Arrow'
import { Box } from './nodes/Box'
import { Emphasis } from './nodes/Emphasis'
import { Frame } from './nodes/Frame'
import { Label } from './nodes/Label'
import { SceneLayer } from './nodes/SceneLayer'
import { SymbolChip } from './nodes/SymbolChip'
import { ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from './constants'
import { computeFitScale } from './useFitScale'
import { latestByClass, latestById, motionLog, resetMotionLog } from './__fixtures__/motion-spy'
import type { SceneProps, Step } from './types'
import { INTRODUCED_AT } from '../presentations/how-to-make-a-presentation/entities'
import { STEPS as SAMPLE_STEPS } from '../presentations/how-to-make-a-presentation/steps'

// Captures the real motion props the kit renders (see __fixtures__/motion-spy.tsx). jsdom has no
// layout engine, so these tests assert wiring (layoutId, layout, transition, presence, enter) and
// DOM identity; the animated motion itself is covered by the browser verification.
vi.mock('motion/react', async (importOriginal) => {
  const { spyOnMotion } = await import('./__fixtures__/motion-spy')
  return spyOnMotion(await importOriginal<typeof import('motion/react')>())
})

interface Entity {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  emphasized?: boolean
  /** Newcomer in this state: fades in through the node's own `enter` prop. */
  enter?: boolean
}

interface Board {
  entities: Entity[]
}

/** Every entity is a plain keyed kit node; only `enter` changes its entrance. No wrappers. */
function BoardScene({ payload }: SceneProps<Board>) {
  return (
    <SceneLayer>
      {payload.entities.map((e) => (
        <Box
          key={e.id}
          id={e.id}
          enter={e.enter}
          x={e.x}
          y={e.y}
          w={e.w}
          h={e.h}
          label={e.label}
          emphasis={e.emphasized}
        />
      ))}
    </SceneLayer>
  )
}

const ent = (id: string, x: number, y: number, w: number, h: number, label: string, extra: Partial<Entity> = {}): Entity => ({
  id,
  x,
  y,
  w,
  h,
  label,
  ...extra,
})

const board = (id: string, entities: Entity[], Scene: Step<Board>['Scene'] = BoardScene, groupKey?: string): Step<Board> => ({
  id,
  era: 'Only',
  title: id.toUpperCase(),
  caption: `${id} caption.`,
  groupKey,
  Scene,
  payload: { entities },
})

const A = ent('a', 0, 0, 100, 50, 'A')
const B = ent('b', 200, 0, 100, 50, 'B')
const N = ent('n', 400, 0, 100, 50, 'N', { enter: true })

// s0 -> s1: n enters. s1 -> s2: a moves and changes label and emphasis, n continues.
// s2 -> s3: n departs and b moves.
const steps = [
  board('s0', [A, B], BoardScene, 'board'),
  board('s1', [A, B, N], BoardScene, 'board'),
  board('s2', [ent('a', 40, 120, 140, 60, 'A2', { emphasized: true }), B, ent('n', 400, 0, 100, 50, 'N')], BoardScene, 'board'),
  board('s3', [ent('a', 40, 120, 140, 60, 'A2', { emphasized: true }), ent('b', 260, 0, 100, 50, 'B')], BoardScene, 'board'),
]

const el = (id: string) => document.querySelector(`[data-presentation-id="${id}"]`) as HTMLElement | null
const stepIndex = () => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')
const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const prev = () => fireEvent.keyDown(window, { key: 'ArrowLeft' })

afterEach(() => cleanup())
beforeEach(() => resetMotionLog())

describe('Persisting entity morphs', () => {
  it('keeps the same DOM node and layoutId while geometry, label, and emphasis change', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const aBefore = el('a')
    expect(latestById('a')?.props).toMatchObject({ layout: true, layoutId: 'a', transition: { duration: LAYOUT_T } })

    next() // s1: a persists unchanged
    expect(el('a')).toBe(aBefore)
    next() // s2: a moves, relabels and gains emphasis
    expect(el('a')).toBe(aBefore)
    expect(aBefore?.style.left).toBe('40px')
    expect(aBefore?.style.top).toBe('120px')
    expect(aBefore?.style.width).toBe('140px')
    expect(aBefore?.style.height).toBe('60px')
    expect(aBefore?.querySelector('[data-presentation-label]')?.textContent).toBe('A2')
    expect(aBefore?.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(latestById('a')?.props).toMatchObject({ layout: true, layoutId: 'a' })
  })

  it('uses a single shared LayoutGroup that is not remounted across navigation', () => {
    render(<Presentation steps={steps} title="Deck" />)
    next()
    next()
    next()
    const mounts = motionLog.groups.filter((g) => g.event === 'mount')
    expect(mounts).toHaveLength(1)
    expect(motionLog.groups.filter((g) => g.event === 'unmount')).toHaveLength(0)
  })
})

describe('Newcomer entrance: the enter prop', () => {
  it('exposes entry constants so a newcomer waits until persisting entities have moved', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_DELAY).toBe(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
  })

  const primitives: Array<[string, (enter: boolean | undefined) => ReactElement, string]> = [
    ['Box', (enter) => <Box id="p" enter={enter} x={1} y={1} w={5} h={5} />, 'p'],
    ['Label', (enter) => <Label id="p" enter={enter} x={1} y={1} w={5} h={5}>t</Label>, 'p'],
    ['Arrow', (enter) => <Arrow id="p" enter={enter} from={[0, 0]} to={[40, 0]} />, 'p'],
    ['Frame', (enter) => <Frame id="p" enter={enter} x={1} y={1} w={5} h={5} />, 'p'],
    ['Emphasis', (enter) => <Emphasis id="p" enter={enter} x={1} y={1} w={5} h={5} />, 'p'],
    ['SymbolChip', (enter) => <SymbolChip id="p" enter={enter} x={1} y={1} w={5} h={5} symbol="*" />, 'p'],
  ]

  it.each(primitives)('%s with enter fades in after the entry delay (>= LAYOUT_T)', (_name, make, id) => {
    render(make(true))
    const { props } = latestById(id) ?? {}
    expect(props?.initial).toEqual({ opacity: 0 })
    expect(props?.animate).toMatchObject({ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } })
    const delay = (props?.animate as { transition: { delay: number } }).transition.delay
    expect(delay).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it.each(primitives)('%s without enter has no initial opacity and no entry animation', (_name, make, id) => {
    render(make(undefined))
    const { props } = latestById(id) ?? {}
    expect(props?.initial).toBeUndefined()
    expect(props?.animate).toBeUndefined()
  })

  it.each(primitives)('%s toggling enter on a mounted node keeps its DOM node and does not remount', (_name, make, id) => {
    const { container, rerender } = render(make(true))
    const node = container.querySelector(`[data-presentation-id="${id}"]`)
    expect(node).not.toBeNull()
    rerender(make(false))
    expect(container.querySelector(`[data-presentation-id="${id}"]`)).toBe(node)
    expect(latestById(id)?.props.initial).toBeUndefined()
    rerender(make(true))
    expect(container.querySelector(`[data-presentation-id="${id}"]`)).toBe(node)
    expect(latestById(id)?.props.initial).toEqual({ opacity: 0 })
  })

  it('Appear keeps its own entry and exit wiring for the wrapper it is given', () => {
    render(
      <Appear className="appear-x">
        <span>child</span>
      </Appear>,
    )
    const wrapper = latestByClass('appear-x')
    expect(wrapper?.props.initial).toEqual({ opacity: 0 })
    expect(wrapper?.props.animate).toMatchObject({ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } })
    expect(wrapper?.props.exit).toEqual({ opacity: 0, transition: { duration: EXIT_T } })
  })
})

describe('Continuing entities are not faded as newcomers', () => {
  it('keeps persisting nodes on layout projection with no entry fade across 3+ forward and back grouped transitions', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const aNode = el('a')
    const bNode = el('b')
    // Forward and back traversal, including a continuing newcomer n (s1 -> s2).
    const visit: Array<[() => void, number]> = [
      [next, 1], [next, 2], [next, 3],
      [prev, 2], [prev, 1], [prev, 0],
      [next, 1], [next, 2],
    ]
    for (const [move, index] of visit) {
      move()
      expect(stepIndex()).toBe(String(index))
      expect(el('a')).toBe(aNode)
      expect(el('b')).toBe(bNode)
      for (const id of ['a', 'b'] as const) {
        const latest = latestById(id)
        expect(latest?.props).toMatchObject({ layout: true, layoutId: id })
        expect(latest?.props.initial).toBeUndefined()
        expect(latest?.props.animate).toBeUndefined()
        expect(el(id)?.closest('[data-presentation-appear]')).toBeNull()
      }
    }
    expect(document.querySelectorAll('[data-presentation-appear]')).toHaveLength(0)
  })

  it('a newcomer stops fading once it continues: its node is not remounted and carries no initial opacity', () => {
    render(<Presentation steps={steps} title="Deck" />)
    next() // s1: n enters
    const nNode = el('n')
    expect(latestById('n')?.props.initial).toEqual({ opacity: 0 })
    next() // s2: n continues (enter is off)
    expect(el('n')).toBe(nNode)
    expect(latestById('n')?.props.initial).toBeUndefined()
    expect(latestById('n')?.props.layoutId).toBe('n')
  })

  it('treats a direct jump to a later step the same as sequential navigation', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const aBefore = el('a')
    fireEvent.click(screen.getByRole('button', { name: 'Step 4: S3' }))
    expect(stepIndex()).toBe('3')
    expect(el('a')).toBe(aBefore)
    expect(latestById('a')?.props).toMatchObject({ layout: true, layoutId: 'a' })
    expect(el('n')).toBeNull()
  })
})

describe('Departing entity exits', () => {
  it('keeps a departing node mounted with exit props while it fades, then removes it', async () => {
    render(<Presentation steps={steps} title="Deck" />)
    next()
    next() // s2: n still present
    expect(latestById('n')?.props.exit).toEqual({ opacity: 0, transition: { duration: EXIT_T } })
    next() // s3: n departs
    expect(el('n')).not.toBeNull()
    await waitFor(() => expect(el('n')).toBeNull(), { timeout: 3000 })
    expect(el('a')).not.toBeNull()
  })

  it('gives a departing direct Box a nontrivial exit (no wrapper)', () => {
    render(<Presentation steps={steps} title="Deck" />)
    next()
    expect(latestById('n')?.props.exit).toEqual({ opacity: 0, transition: { duration: EXIT_T } })
  })

  it('exits the outgoing scene through the presence host when the scene host changes', async () => {
    // Distinct ids across the swap: a shared layoutId between exiting and incoming scenes stalls in jsdom.
    const plain: Step<Board>[] = [board('u1', [A, B]), board('u2', [ent('c', 0, 0, 80, 40, 'C')])]
    render(<Presentation steps={plain} title="Deck" />)
    const outgoing = motionLog.renders.find((r) => r.props['data-presentation-scene'] !== undefined)
    expect(outgoing).toBeDefined()
    next()
    const outgoingLatest = [...motionLog.renders].reverse().find((r) => r.instance === outgoing?.instance)
    expect(outgoingLatest?.props.exit).toEqual({ opacity: 0, transition: { duration: EXIT_T } })
    // The scene host's presence now holds the incoming key while the outgoing scene stays mounted.
    expect(motionLog.presence.some((p) => p.childKeys.includes('step:u1'))).toBe(true)
    expect([...motionLog.presence].reverse().find((p) => p.childKeys.includes('step:u2'))).toBeDefined()
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(2)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1), { timeout: 3000 })
    expect(el('c')).not.toBeNull()
  })
})

describe('Fixed canvas scale and mode switching', () => {
  const viewport = { width: 800, height: 500 }

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: viewport.width, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: viewport.height, configurable: true })
  })

  it('keeps scale identical across step changes within a mode, with a constant 880 x 380 canvas', () => {
    const extents = [
      board('small', [ent('a', 0, 0, 20, 20, 'a')], BoardScene, 'board'),
      board('large', [ent('a', 700, 300, 150, 60, 'a')], BoardScene, 'board'),
    ]
    render(<Presentation steps={extents} title="Deck" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    const browseScale = String(computeFitScale(viewport, 'browse'))
    expect(canvas.getAttribute('data-presentation-scale')).toBe(browseScale)
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    next()
    expect(canvas.getAttribute('data-presentation-scale')).toBe(browseScale)
    expect(canvas.style.width).toBe('880px')
  })

  it('switches to the present-mode geometry at the same step without projecting entities across the change', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    next()
    const index = stepIndex()
    const aBefore = el('a')
    const groupsBefore = motionLog.groups.length
    const groupMountsBefore = motionLog.groups.filter((g) => g.event === 'mount').map((g) => g.instance)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement

    fireEvent.click(screen.getByRole('button', { name: 'Present' }))

    expect(stepIndex()).toBe(index)
    expect(canvas.getAttribute('data-presentation-scale')).toBe(String(computeFitScale(viewport, 'present')))
    expect(computeFitScale(viewport, 'present')).not.toBe(computeFitScale(viewport, 'browse'))
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    // Stage's LayoutGroup is keyed by mode: the old group is torn down and a new one mounts, so no
    // entity projection carries from the old geometry into the new one.
    const newGroups = motionLog.groups.slice(groupsBefore).filter((g) => g.event === 'mount')
    expect(newGroups).toHaveLength(1)
    expect(groupMountsBefore).not.toContain(newGroups[0].instance)
    expect(motionLog.groups.slice(groupsBefore).some((g) => g.event === 'unmount')).toBe(true)
    expect(el('a')).not.toBe(aBefore)
  })
})

describe('Coordinate-heavy diagrams: raw motion elements', () => {
  function RawScene({ payload }: SceneProps<number>) {
    return (
      <SceneLayer>
        <motion.div
          className="raw-x"
          layout
          layoutId="raw-x"
          style={{ position: 'absolute', left: payload, top: 30, width: 20, height: 20 }}
        />
      </SceneLayer>
    )
  }

  it('keeps a raw motion element layoutId and coordinates across navigation', () => {
    const rawSteps: Step<number>[] = [
      { id: 'r1', era: 'Only', title: 'R1', caption: 'r1', groupKey: 'raw', Scene: RawScene, payload: 10 },
      { id: 'r2', era: 'Only', title: 'R2', caption: 'r2', groupKey: 'raw', Scene: RawScene, payload: 300 },
    ]
    render(<Presentation steps={rawSteps} title="Deck" />)
    const raw = document.querySelector('.raw-x') as HTMLElement
    expect(raw.style.left).toBe('10px')
    expect(latestByClass('raw-x')?.props.layoutId).toBe('raw-x')
    next()
    expect(document.querySelector('.raw-x')).toBe(raw)
    expect(raw.style.left).toBe('300px')
    expect(latestByClass('raw-x')?.props.layoutId).toBe('raw-x')
  })
})

describe('Reference sample, walked forward through every state (kit contract)', () => {
  it('marks only entities introduced at the active step as newcomers, leaves continuing nodes unwrapped, and keeps persisting nodes in place', () => {
    render(<Presentation steps={SAMPLE_STEPS} title="Sample" initialMode="browse" />)
    const seen = new Map<string, HTMLElement | null>()
    for (let i = 0; i < SAMPLE_STEPS.length; i++) {
      if (i > 0) next()
      expect(stepIndex()).toBe(String(i))
      expect(document.querySelectorAll('[data-presentation-appear]')).toHaveLength(0)
      const present = Array.from(document.querySelectorAll('[data-presentation-id]')).map((n) => n.getAttribute('data-presentation-id') ?? '')
      expect(new Set(present)).toEqual(new Set(Object.keys(INTRODUCED_AT).filter((id) => INTRODUCED_AT[id as keyof typeof INTRODUCED_AT] <= i)))
      for (const id of present) {
        const newcomer = i > 0 && INTRODUCED_AT[id as keyof typeof INTRODUCED_AT] === i
        const props = latestById(id)?.props
        if (newcomer) expect(props?.initial, `${id} at step ${i}`).toEqual({ opacity: 0 })
        else expect(props?.initial, `${id} at step ${i}`).toBeUndefined()
        const node = el(id)
        if (seen.has(id) && !newcomer) expect(node, `${id} identity at step ${i}`).toBe(seen.get(id))
        seen.set(id, node)
      }
    }
  })
})
