// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { EXIT, LAYOUT_T, LAYOUT_TRANSITION } from '../../src/presentation-kit/constants'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer } from '../../src/presentation-kit'
import { stubViewport } from './fixtures'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { Diagram } from '../../src/presentations/how-to-make-a-presentation/scene'
import type { DiagramState } from '../../src/presentations/how-to-make-a-presentation/entities'
import { motion } from 'motion/react'

// Records the props each motion element receives, and renders a plain element that keeps the
// author-visible props (className, style, data-*, children). Motion-only props are dropped.
// AnimatePresence stays real; these tests check props and DOM structure, not animation.
const received: Array<Record<string, unknown>> = []
const MOTION_ONLY = new Set(['layout', 'layoutId', 'transition', 'initial', 'animate', 'exit', 'rotate'])

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const div = (props: Record<string, unknown>) => {
    received.push(props)
    const visible = Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_ONLY.has(key)))
    return createElement('div', visible as Record<string, unknown>, props.children as ReactNode)
  }
  return { ...actual, motion: new Proxy(actual.motion, { get: (target, key) => (key === 'div' ? div : Reflect.get(target, key)) }) }
})

beforeEach(() => {
  received.length = 0
})

function propsFor(predicate: (props: Record<string, unknown>) => boolean) {
  return received.filter(predicate)
}

describe('primitives pass layoutId, a layout transition, and an exit to motion', () => {
  it.each([
    ['Box', <Box key="x" id="x" />],
    ['Label', <Label key="x" id="x" />],
    ['Arrow', <Arrow key="x" id="x" x={0} y={0} length={10} />],
    ['Frame', <Frame key="x" id="x" geometry={{ x: 0, y: 0, w: 1, h: 1 }} />],
    ['Emphasis', <Emphasis key="x" id="x" />],
    ['SymbolChip', <SymbolChip key="x" id="x" />],
  ])('%s keeps its stable id as layoutId, morphs for LAYOUT_T, and exits by fading out', (_name, element) => {
    render(<SceneLayer>{element}</SceneLayer>)
    const [props] = propsFor((p) => p.layoutId === 'x')
    expect(props).toBeDefined()
    expect(props.layout).toBe(true)
    expect((props.transition as { layout: { duration: number } }).layout.duration).toBe(LAYOUT_T)
    expect((props.transition as { layout: unknown }).layout).toBe(LAYOUT_TRANSITION)
    expect(props.exit).toBe(EXIT)
    expect((props.exit as { opacity: number }).opacity).toBe(0)
    expect((props.exit as { transition: { duration: number } }).transition.duration).toBe(LAYOUT_T)
  })
})

describe('newcomers are classified against the previous step, forward and backward', () => {
  const payloadOf = (i: number): DiagramState => STEPS[i].payload

  /** Which entity ids are wrapped in Appear when `payload` is shown after `previous`. */
  function wrappedIds(payload: DiagramState, previous?: DiagramState) {
    const { container, unmount } = render(<Diagram payload={payload} previous={previous} />)
    const result = payload.visible.map((id) => {
      const node = container.querySelector(`[data-presentation-id="${id}"]`)
      return { id, wrapped: node!.closest('[data-presentation-appear]') !== null }
    })
    unmount()
    return result
  }

  it('forward: an id visible in the previous step is outside Appear, and a new id is inside it', () => {
    for (let i = 1; i < STEPS.length; i += 1) {
      const previous = new Set(payloadOf(i - 1).visible)
      for (const { id, wrapped } of wrappedIds(payloadOf(i), payloadOf(i - 1))) {
        expect(wrapped, `forward to step ${i + 1}, ${id}`).toBe(!previous.has(id))
      }
    }
  })

  it('backward: going from a later step back to an earlier one wraps nothing that was already on screen', () => {
    for (let i = STEPS.length - 1; i >= 1; i -= 1) {
      for (const { id, wrapped } of wrappedIds(payloadOf(i - 1), payloadOf(i))) {
        expect(wrapped, `backward to step ${i}, ${id}`).toBe(false)
      }
    }
  })

  it('a transition with no newcomers renders no Appear wrapper at all', () => {
    const payload = { visible: ['you', 'prompt'], emphasized: [] }
    const { container } = render(<Diagram payload={payload} previous={payload} />)
    expect(container.querySelectorAll('[data-presentation-appear]')).toHaveLength(0)
  })
})

describe('coordinate-heavy diagrams with a raw motion element', () => {
  it('a raw motion element keeps its layoutId, and its author coordinates update within one grouped scene', () => {
    stubViewport(1280)
    function Dot({ payload }: { payload: { x: number } }) {
      return createElement(
        SceneLayer,
        null,
        createElement(motion.div, {
          layoutId: 'dot',
          'data-presentation-id': 'dot',
          style: { position: 'absolute', left: payload.x, top: 10 },
        }),
      )
    }
    const steps = [0, 300].map((x, i) => ({
      id: `s${i}`,
      era: 'e',
      title: `t${i}`,
      caption: `c${i}`,
      groupKey: 'dots',
      Scene: Dot as never,
      payload: { x },
    }))
    const { container } = render(<Presentation title="t" steps={steps} />)
    const node = container.querySelector('[data-presentation-id="dot"]') as HTMLElement
    expect(propsFor((p) => p.layoutId === 'dot').length).toBeGreaterThan(0)
    expect(node.style.left).toBe('0px')
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(container.querySelector('[data-presentation-id="dot"]')).toBe(node)
    expect(node.style.left).toBe('300px')
  })
})
