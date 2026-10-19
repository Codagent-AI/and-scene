import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { motion } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import { Appear } from './nodes/Appear'
import { Box } from './nodes/Box'
import { SceneLayer } from './nodes/SceneLayer'
import { ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from './constants'
import { computeFitScale } from './useFitScale'
import { latestByClass, latestById, motionLog, resetMotionLog } from './__fixtures__/motion-spy'
import type { SceneProps, Step } from './types'

// Captures the real motion props the kit renders (see __fixtures__/motion-spy.tsx). jsdom has no
// layout engine, so these tests assert wiring (layoutId, layout, transition, presence) and DOM
// identity; the animated motion itself is covered by the browser verification.
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
  /** Genuinely new in this state: wrapped in Appear. */
  isNew?: boolean
}

interface Board {
  entities: Entity[]
}

function BoardScene({ payload }: SceneProps<Board>) {
  return (
    <SceneLayer>
      {payload.entities.map((e) => {
        const node = (
          <Box id={e.id} x={e.x} y={e.y} w={e.w} h={e.h} label={e.label} emphasis={e.emphasized} />
        )
        return e.isNew ? (
          <Appear key={e.id} className={`newcomer-${e.id}`}>
            {node}
          </Appear>
        ) : (
          <Box key={e.id} id={e.id} x={e.x} y={e.y} w={e.w} h={e.h} label={e.label} emphasis={e.emphasized} />
        )
      })}
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
const N = ent('n', 400, 0, 100, 50, 'N', { isNew: true })

const steps = [
  board('s0', [A, B], BoardScene, 'board'),
  board('s1', [A, B, N], BoardScene, 'board'),
  board('s2', [ent('a', 40, 120, 140, 60, 'A2', { emphasized: true }), B], BoardScene, 'board'),
  board('s3', [ent('a', 40, 120, 140, 60, 'A2', { emphasized: true }), ent('b', 260, 0, 100, 50, 'B')], BoardScene, 'board'),
]

const el = (id: string) => document.querySelector(`[data-presentation-id="${id}"]`) as HTMLElement | null
const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const prev = () => fireEvent.keyDown(window, { key: 'ArrowLeft' })

afterEach(() => cleanup())
beforeEach(() => resetMotionLog())

describe('Persisting entity morphs', () => {
  it('keeps the same DOM node and layoutId while geometry, label, and emphasis change', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const aBefore = el('a')
    expect(aBefore).not.toBeNull()
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

describe('New entity enters after others settle', () => {
  it('exposes the entry delay constants so newcomers wait for layout', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_DELAY).toBe(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
  })

  it('wraps only the newcomer in Appear, with an initial state and a delayed animate state', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expect(latestByClass('newcomer-n')).toBeUndefined()
    next()
    const newcomer = latestByClass('newcomer-n')
    expect(newcomer?.tag).toBe('div')
    expect(newcomer?.props.initial).toEqual({ opacity: 0 })
    expect(newcomer?.props.animate).toMatchObject({
      opacity: 1,
      transition: { duration: ENTER_T, delay: ENTER_DELAY },
    })
    const delay = (newcomer?.props.animate as { transition: { delay: number } }).transition.delay
    expect(delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(document.querySelector('[data-presentation-id="n"]')?.closest('[data-presentation-appear]')).not.toBeNull()
    expect(el('a')?.closest('[data-presentation-appear]')).toBeNull()
    expect(el('b')?.closest('[data-presentation-appear]')).toBeNull()
  })
})

describe('Departing entity exits', () => {
  it('keeps the departing node in an AnimatePresence with nontrivial exit props, then drops it from the next state', async () => {
    render(<Presentation steps={steps} title="Deck" />)
    next() // s1: n is present and wrapped
    const exiting = latestByClass('newcomer-n')
    expect(exiting?.props.exit).toEqual({ opacity: 0, transition: { duration: EXIT_T } })
    const layerPresence = [...motionLog.presence].reverse().find((p) => p.childKeys.includes('n'))
    expect(layerPresence?.childKeys).toEqual(expect.arrayContaining(['a', 'b', 'n']))

    next() // s2: n departs
    const presenceAfter = [...motionLog.presence].reverse().find((p) => p.childKeys.includes('a'))
    expect(presenceAfter?.childKeys).not.toContain('n')
    expect(presenceAfter?.childKeys).toEqual(expect.arrayContaining(['a', 'b']))
    // AnimatePresence keeps the departing node mounted while its exit runs, then removes it.
    expect(el('n')).not.toBeNull()
    await waitFor(() => expect(el('n')).toBeNull(), { timeout: 3000 })
    expect(el('a')).not.toBeNull()
  })

  it('gives a departing node a nontrivial exit on a direct Box (not only Appear wrappers)', () => {
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
    const outgoingLatest = [...motionLog.renders]
      .reverse()
      .find((r) => r.instance === outgoing?.instance)
    expect(outgoingLatest?.props.exit).toEqual({ opacity: 0, transition: { duration: EXIT_T } })
    // The scene host's presence now holds the incoming key while the outgoing scene stays mounted.
    expect(motionLog.presence.some((p) => p.childKeys.includes('step:u1'))).toBe(true)
    expect([...motionLog.presence].reverse().find((p) => p.childKeys.includes('step:u2'))).toBeDefined()
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(2)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1), { timeout: 3000 })
    expect(el('c')).not.toBeNull()
  })
})

describe('Continuing entities are not faded as newcomers', () => {
  it('keeps continuing nodes on layout projection with DOM identity across grouped forward and back navigation', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const initial = { a: el('a'), b: el('b') }
    const visit = [next, next, next, prev, prev, prev, next]
    const expectedIndex = [1, 2, 3, 2, 1, 0, 1]
    visit.forEach((move, i) => {
      move()
      expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe(String(expectedIndex[i]))
      for (const id of ['a', 'b'] as const) {
        const present = el(id)
        if (!present) continue
        expect(present).toBe(initial[id])
        const latest = latestById(id)
        expect(latest?.props).toMatchObject({ layout: true, layoutId: id })
        expect(latest?.props.initial).toBeUndefined()
        expect(present.closest('[data-presentation-appear]')).toBeNull()
      }
    })
    // The newcomer is genuinely new on each visit to s1 and carries the fade-in.
    expect(latestByClass('newcomer-n')?.props.initial).toEqual({ opacity: 0 })
  })

  it('treats a direct jump to a later step the same as sequential navigation', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const aBefore = el('a')
    fireEvent.click(screen.getByRole('button', { name: 'Step 4: S3' }))
    expect(el('a')).toBe(aBefore)
    expect(latestById('a')?.props).toMatchObject({ layout: true, layoutId: 'a' })
    expect(el('n')).toBeNull()
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
    const stepIndex = document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')
    const aBefore = el('a')
    const groupsBefore = motionLog.groups.length
    const groupMountsBefore = motionLog.groups.filter((g) => g.event === 'mount').map((g) => g.instance)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement

    fireEvent.click(screen.getByRole('button', { name: 'Present' }))

    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe(stepIndex)
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
