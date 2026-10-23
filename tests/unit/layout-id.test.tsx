// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { LAYOUT_T, LAYOUT_TRANSITION } from '../../src/presentation-kit/constants'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer } from '../../src/presentation-kit'
import { stubViewport } from './fixtures'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { Diagram } from '../../src/presentations/how-to-make-a-presentation/scene'

// Records the props each motion element receives, and renders a plain element that keeps the
// author-visible props (className, style, data-*, children). Motion-only props are dropped.
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

describe('primitives pass layoutId and a layout transition to motion', () => {
  it.each([
    ['Box', <Box key="x" id="x" />],
    ['Label', <Label key="x" id="x" />],
    ['Arrow', <Arrow key="x" id="x" x={0} y={0} length={10} />],
    ['Frame', <Frame key="x" id="x" geometry={{ x: 0, y: 0, w: 1, h: 1 }} />],
    ['Emphasis', <Emphasis key="x" id="x" />],
    ['SymbolChip', <SymbolChip key="x" id="x" />],
  ])('%s keeps its stable id as layoutId and morphs for LAYOUT_T', (_name, element) => {
    render(<SceneLayer>{element}</SceneLayer>)
    const [props] = propsFor((p) => p.layoutId === 'x')
    expect(props).toBeDefined()
    expect(props.layout).toBe(true)
    expect((props.transition as { layout: { duration: number } }).layout.duration).toBe(LAYOUT_T)
    expect((props.transition as { layout: unknown }).layout).toBe(LAYOUT_TRANSITION)
  })
})

describe('continuing entities are not wrapped in newcomer fade-in', () => {
  it('for every consecutive sample pair, continuing ids are outside Appear and new ids are inside it', () => {
    for (let i = 1; i < STEPS.length; i += 1) {
      const { container, unmount } = render(<Diagram payload={STEPS[i].payload} />)
      const previous = new Set(STEPS[i - 1].payload.visible)
      for (const id of STEPS[i].payload.visible) {
        const node = container.querySelector(`[data-presentation-id="${id}"]`)
        expect(node, `step ${i + 1} ${id}`).not.toBeNull()
        const wrapped = node!.closest('[data-presentation-appear]') !== null
        const newcomer = !previous.has(id)
        expect(wrapped, `step ${i + 1} ${id} newcomer=${newcomer}`).toBe(newcomer)
      }
      unmount()
    }
  })

  it('a transition with no newcomers renders no Appear wrapper at all', () => {
    const payload = { visible: ['you', 'prompt'], added: [], emphasized: [] }
    const { container } = render(<Diagram payload={payload} />)
    expect(container.querySelectorAll('[data-presentation-appear]')).toHaveLength(0)
  })
})

describe('coordinate-heavy diagrams with a raw motion element', () => {
  it('a raw motion element keeps its layoutId and author coordinates inside a grouped scene', () => {
    function Dot({ payload }: { payload: { x: number } }) {
      return createElement(
        SceneLayer,
        null,
        createElement('div', { 'data-presentation-id': 'dot', style: { position: 'absolute', left: payload.x, top: 10 } }),
      )
    }
    stubViewport(1280)
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
    expect(node.style.left).toBe('0px')
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(container.querySelector('[data-presentation-id="dot"]')).toBe(node)
    expect(node.style.left).toBe('300px')
  })
})
