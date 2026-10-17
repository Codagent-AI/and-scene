import { cleanup, render } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { Camera } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from '../constants'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presence, SceneLayer, SymbolChip } from '../nodes'

const recorded = vi.hoisted(() => ({ props: [] as Record<string, unknown>[] }))

vi.mock('motion/react', () => {
  const motionOnly = new Set([
    'layout', 'layoutId', 'initial', 'animate', 'exit', 'transition',
    'markerEnd', 'markerStart',
  ])
  const cache = new Map<string, unknown>()
  const make = (tag: string) =>
    cache.get(tag) ??
    (cache.set(tag, function Mock(props: Record<string, unknown>) {
      recorded.props.push({ tag, ...props })
      const dom: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(props)) if (!motionOnly.has(key)) dom[key] = value
      return createElement(tag, dom)
    }), cache.get(tag))
  return {
    motion: new Proxy({}, { get: (_target, tag: string) => make(tag) }),
    AnimatePresence: ({ children, initial }: { children?: ReactNode; initial?: boolean }) =>
      createElement('div', { 'data-mock-presence': String(initial) }, children),
  }
})

afterEach(() => {
  cleanup()
  recorded.props.length = 0
})

const kinds = [
  ['box', Box],
  ['label', Label],
  ['frame', Frame],
  ['emphasis', Emphasis],
  ['symbol-chip', SymbolChip],
] as const

describe('generic node primitives', () => {
  it.each(kinds)('%s forwards identity, layout hooks, author class, style and data attributes', (kind, Node) => {
    const { container } = render(
      <Node id="e1" x={10} y={20} w={30} h={40} className="mine" style={{ opacity: 0.5 }} data-extra="yes">
        text
      </Node>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-presentation-entity')).toBe('e1')
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
    expect(el.getAttribute('data-extra')).toBe('yes')
    expect(el.className).toBe('mine')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('30px')
    expect(el.style.height).toBe('40px')
    expect(el.style.position).toBe('absolute')
    expect(el.style.opacity).toBe('0.5')
    expect(el.textContent).toBe('text')
    const props = recorded.props[0]
    expect(props.layoutId).toBe('e1')
    expect(props.layout).toBe(true)
  })

  it('uses the layout timing constants for position morphs and a timed exit', () => {
    render(<Box id="e" />)
    const props = recorded.props[0]
    expect(props.transition).toMatchObject({ layout: { duration: LAYOUT_T } })
    expect(props.exit).toMatchObject({ opacity: 0, transition: { duration: EXIT_T } })
  })

  it('adds no class or visual style of its own', () => {
    const { container } = render(<Box id="e" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.hasAttribute('class')).toBe(false)
    expect(Object.keys(el.style).filter((k) => /^\d+$/.test(k)).map((k) => el.style[Number(k)]).sort()).toEqual(
      ['position'],
    )
  })

  it('renders an optional Lucide icon component, and none by default', () => {
    const withIcon = render(<Box id="a" icon={Camera}>x</Box>)
    expect(withIcon.container.querySelector('svg[data-presentation-icon]')).not.toBeNull()
    cleanup()
    const without = render(<Box id="b">x</Box>)
    expect(without.container.querySelector('svg')).toBeNull()
  })

  it('keeps the allow-overlap marker on the rendered element', () => {
    const { container } = render(<Box id="m" data-presentation-allow-overlap="" />)
    expect(container.firstElementChild?.hasAttribute('data-presentation-allow-overlap')).toBe(true)
  })

  it('lets authors place raw coordinates through style', () => {
    const { container } = render(<Box id="r" style={{ left: 5, top: 6 }} />)
    const el = container.firstElementChild as HTMLElement
    expect([el.style.left, el.style.top]).toEqual(['5px', '6px'])
  })
})

describe('Arrow', () => {
  it('draws a path between points with identity hooks and arrowheads on request', () => {
    const { container } = render(
      <Arrow id="a1" from={[0, 0]} to={[100, 0]} bidirectional className="line" />,
    )
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('data-presentation-entity')).toBe('a1')
    expect(svg.getAttribute('data-presentation-node')).toBe('arrow')
    expect(svg.getAttribute('class')).toBe('line')
    const path = recorded.props.find((p) => p.tag === 'path')!
    expect(path.markerStart).toContain('a1-tail')
    expect(path.markerEnd).toContain('a1-head')
    expect(path.animate).toEqual({ d: 'M 0 0 Q 50 0 100 0' })
  })

  it('curves by a perpendicular offset', () => {
    render(<Arrow id="c" from={[0, 0]} to={[100, 0]} curve={20} />)
    const path = recorded.props.find((p) => p.tag === 'path')!
    expect(path.animate).toEqual({ d: 'M 0 0 Q 50 20 100 0' })
  })
})

describe('Appear', () => {
  it('fades newcomers in after the layout move, on mount only', () => {
    const { container } = render(<Appear>child</Appear>)
    const props = recorded.props[0]
    expect(props.initial).toEqual({ opacity: 0 })
    expect(props.animate).toEqual({ opacity: 1 })
    expect(props.transition).toMatchObject({ delay: ENTER_DELAY, duration: ENTER_T })
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(container.firstElementChild?.hasAttribute('data-presentation-appear')).toBe(true)
  })

  it('stays mounted when only its children change', () => {
    let mounted = 0
    function Probe({ label }: { label: string }) {
      return <span ref={() => void mounted++}>{label}</span>
    }
    const view = render(<Appear><Probe label="a" /></Appear>)
    const first = view.container.firstElementChild
    view.rerender(<Appear><Probe label="b" /></Appear>)
    expect(view.container.firstElementChild).toBe(first)
    expect(view.container.textContent).toBe('b')
  })
})

describe('layers and presence', () => {
  it('SceneLayer covers the canvas and forwards author props', () => {
    const { container } = render(<SceneLayer className="layer" data-x="1" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toBe('layer')
    expect(el.getAttribute('data-x')).toBe('1')
    expect(el.hasAttribute('data-presentation-scene-layer')).toBe(true)
    expect(el.style.position).toBe('absolute')
  })

  it('Presence skips entry for entities present on mount and exposes exits', () => {
    const { container } = render(<Presence><Box id="p" key="p" /></Presence>)
    expect(container.querySelector('[data-mock-presence="false"]')).not.toBeNull()
  })
})
