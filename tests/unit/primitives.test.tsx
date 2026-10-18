// Runs the kit against a recording stand-in for motion/react so wiring (layoutId,
// layout, enter/exit props, presence hosts) can be asserted exactly.
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface Call {
  tag: string
  props: Record<string, unknown>
}
const calls = vi.hoisted(() => [] as Call[])

vi.mock('motion/react', async () => {
  const React = await import('react')
  const cache = new Map<string, unknown>()
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            React.forwardRef((props: Record<string, unknown>, ref) => {
              const { children, layoutId, layout, initial, animate, exit, transition, ...rest } = props
              calls.push({ tag, props: { layoutId, layout, initial, animate, exit, transition, ...rest } })
              return React.createElement(tag, { ...rest, ref, 'data-layout-id': layoutId }, children as ReactNode)
            }),
          )
        }
        return cache.get(tag)
      },
    },
  )
  const host = (name: string) => ({ children }: { children?: ReactNode }) => React.createElement('div', { 'data-mock': name }, children)
  return { motion, AnimatePresence: host('AnimatePresence'), LayoutGroup: host('LayoutGroup') }
})

import {
  Appear,
  Arrow,
  Box,
  DESIGN_H,
  DESIGN_W,
  Emphasis,
  ENTER_DELAY,
  Frame,
  LAYOUT_T,
  Label,
  Presentation,
  SceneLayer,
  Stage,
  SymbolChip,
  computeFitScale,
} from '../../src/presentation-kit'
import { makeSteps, setViewport } from '../support/fixtures'

const GEOMETRY_ONLY = new Set(['position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'display', 'flexDirection', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignItems', 'justifyContent', 'overflow', 'transform', 'transformOrigin'])

function inlineProps(root: ParentNode): string[] {
  const props = new Set<string>()
  for (const el of root.querySelectorAll<HTMLElement>('[style]')) {
    for (const p of Array.from(el.style)) props.add(p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()))
  }
  return [...props]
}

beforeEach(() => {
  calls.length = 0
  setViewport(1440, 900)
})

const ENTITY_CASES: Array<[string, (p: Record<string, unknown>) => ReactNode, string]> = [
  ['box', (p) => <Box id="e" {...p}>x</Box>, 'div'],
  ['label', (p) => <Label id="e" {...p}>x</Label>, 'span'],
  ['frame', (p) => <Frame id="e" {...p} />, 'div'],
  ['emphasis', (p) => <Emphasis id="e" {...p}>x</Emphasis>, 'div'],
  ['symbol-chip', (p) => <SymbolChip id="e" symbol="?" {...p} />, 'span'],
]

describe('entity primitives', () => {
  it.each(ENTITY_CASES)('%s: stable hooks, passthrough, and layoutId from identity', (name, make, tag) => {
    const { container } = render(
      <>{make({ className: 'mine', style: { color: 'red' }, 'data-extra': 'yes', at: { x: 10, y: 20, w: 30, h: 40 } })}</>,
    )
    const el = container.querySelector<HTMLElement>(`[data-presentation-node="${name}"]`)!
    expect(el.tagName.toLowerCase()).toBe(tag)
    expect(el.dataset.presentationId).toBe('e')
    expect(el.dataset.extra).toBe('yes')
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.style.color).toBe('red')
    expect([el.style.left, el.style.top, el.style.width, el.style.height, el.style.position]).toEqual(['10px', '20px', '30px', '40px', 'absolute'])
    const call = calls.find((c) => c.props['data-presentation-node'] === name)!
    expect(call.props.layoutId).toBe('e')
    expect(call.props.layout).toBe(true)
    const exit = call.props.exit as { opacity: number; transition: { duration: number } }
    expect(exit.opacity).toBe(0)
    expect(exit.transition.duration).toBeGreaterThan(0)
    expect((call.props.transition as { layout: { duration: number } }).layout.duration).toBe(LAYOUT_T)
    // a continuing entity has no entry animation
    expect(call.props.initial).toBeUndefined()
  })

  it('Arrow carries identity, hooks, passthrough, and animates its path geometry', () => {
    const { container } = render(<Arrow id="a" from={[0, 0]} to={[100, 0]} twoWay className="mine" style={{ stroke: 'red' }} />)
    const svg = container.querySelector<SVGElement>('[data-presentation-node="arrow"]')!
    expect(svg.getAttribute('data-layout-id')).toBe('a')
    expect(svg.getAttribute('class')).toBe('mine')
    expect(svg.style.stroke).toBe('red')
    const paths = calls.filter((c) => c.tag === 'path')
    expect(paths.length).toBeGreaterThanOrEqual(3)
    expect(paths.every((p) => typeof (p.props.animate as { d: string }).d === 'string')).toBe(true)
  })

  it('Box renders an optional icon component and children', () => {
    const { container, rerender } = render(<Box id="b">text</Box>)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.textContent).toBe('text')
    rerender(<Box id="b" Icon={Check}>text</Box>)
    expect(container.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
    expect(container.textContent).toBe('text')
  })

  it('raw motion entities can be composed with their own layoutId inside a layer', async () => {
    const { motion } = await import('motion/react')
    const { container } = render(
      <SceneLayer>
        <motion.div key="raw" layoutId="raw-entity" data-raw="" style={{ left: 5 }} />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-raw]')!.getAttribute('data-layout-id')).toBe('raw-entity')
  })
})

describe('Appear', () => {
  it('fades newcomers in only after the layout morph used by continuing entities', () => {
    render(<Box id="b" />)
    render(<Appear />)
    const box = calls.find((c) => c.props['data-presentation-node'] === 'box')!
    const appear = calls.find((c) => 'data-presentation-appear' in c.props)!
    const layoutDuration = (box.props.transition as { layout: { duration: number } }).layout.duration
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(appear.props.initial).toEqual({ opacity: 0 })
    const animate = appear.props.animate as { opacity: number; transition: { delay: number; duration: number } }
    expect(animate.opacity).toBe(1)
    expect(animate.transition.delay).toBeGreaterThanOrEqual(layoutDuration)
    expect(animate.transition.duration).toBeGreaterThan(0)
    expect((appear.props.exit as { opacity: number }).opacity).toBe(0)
  })
})

describe('SceneLayer', () => {
  it('is an absolutely positioned presence host that never reflows siblings', () => {
    const { container } = render(
      <>
        <SceneLayer className="one">
          <Label key="l" id="l" at={{ x: 100, y: 50, w: 20, h: 10 }} style={{ zIndex: 3 }} />
        </SceneLayer>
        <SceneLayer className="two" />
      </>,
    )
    const layers = [...container.querySelectorAll<HTMLElement>('[data-presentation-layer]')]
    expect(layers).toHaveLength(2)
    for (const l of layers) {
      expect([l.style.position, l.style.top, l.style.left]).toEqual(['absolute', '0px', '0px'])
      expect(l.querySelector('[data-mock="AnimatePresence"]')).not.toBeNull()
    }
    const label = container.querySelector<HTMLElement>('[data-presentation-id="l"]')!
    expect([label.style.left, label.style.top, label.style.width, label.style.height, label.style.zIndex]).toEqual(['100px', '50px', '20px', '10px', '3'])
  })

  it('passes overlapping literal coordinates through unchanged across updates and added layers', () => {
    const overlap = (
      <>
        <Box id="a" at={{ x: 10, y: 10, w: 100, h: 60 }} style={{ zIndex: 1 }} />
        <Box id="b" at={{ x: 40, y: 30, w: 100, h: 60 }} style={{ zIndex: 2, transform: 'rotate(3deg)' }} />
      </>
    )
    const snapshot = (c: HTMLElement) =>
      ['a', 'b'].map((id) => c.querySelector<HTMLElement>(`[data-presentation-id="${id}"]`)!.getAttribute('style'))
    const { container, rerender } = render(<SceneLayer>{overlap}</SceneLayer>)
    const before = snapshot(container)
    rerender(
      <>
        <SceneLayer>{overlap}</SceneLayer>
        <SceneLayer>
          <Label id="c" at={{ x: 0, y: 0 }} />
        </SceneLayer>
      </>,
    )
    expect(snapshot(container)).toEqual(before)
  })
})

describe('Stage', () => {
  const [first, second] = makeSteps(2)

  it('hosts the active scene in LayoutGroup + AnimatePresence on the 880 x 380 canvas', () => {
    const { container } = render(<Stage step={first} mode="browse" />)
    const group = container.querySelector('[data-mock="LayoutGroup"]')!
    const presence = group.querySelector('[data-mock="AnimatePresence"]')!
    expect(presence.querySelector('[data-presentation-scene] [data-testid="list-scene"]')).not.toBeNull()
    const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect([canvas.style.width, canvas.style.height]).toEqual([`${DESIGN_W}px`, `${DESIGN_H}px`])
    const scale = computeFitScale(1440, 900, 'browse')
    expect(canvas.style.transform).toBe(`scale(${scale})`)
  })

  it('keeps one uniform scale across steps and recomputes it on resize and mode change', () => {
    const scaleOf = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-canvas]')!.style.transform
    const { container, rerender } = render(<Stage step={first} mode="browse" />)
    const initial = scaleOf(container)
    expect(initial).toMatch(/^scale\([\d.]+\)$/)
    rerender(<Stage step={second} mode="browse" />)
    expect(scaleOf(container)).toBe(initial)
    rerender(<Stage step={second} mode="present" />)
    expect(scaleOf(container)).toBe(`scale(${computeFitScale(1440, 900, 'present')})`)
    expect(scaleOf(container)).not.toBe(initial)
    rerender(<Stage step={second} mode="browse" />)
    setViewport(700, 500)
    rerender(<Stage step={second} mode="browse" />)
    expect(scaleOf(container)).toBe(`scale(${computeFitScale(700, 500, 'browse')})`)
  })

  it('does not animate the mode change as a layout morph', () => {
    const { container, rerender } = render(<Stage step={first} mode="browse" />)
    const sceneBefore = container.querySelector('[data-presentation-scene]')
    rerender(<Stage step={first} mode="present" />)
    expect(container.querySelector('[data-presentation-scene]')).not.toBe(sceneBefore)
  })
})

describe('unstyled kit output', () => {
  it('bare-rendered primitives and chrome set only geometry inline, never visual defaults', () => {
    const { container } = render(
      <Presentation steps={[{ ...makeSteps(1)[0], Scene: () => (
        <SceneLayer>
          <Box key="b" id="b" at={{ x: 1, y: 2, w: 3, h: 4 }} Icon={Check} />
          <Label key="l" id="l" />
          <Frame key="f" id="f" />
          <Emphasis key="e" id="e" />
          <SymbolChip key="s" id="s" symbol="?" />
          <Arrow key="a" id="a" from={[0, 0]} to={[5, 5]} />
          <Appear key="ap" />
        </SceneLayer>
      ) }, ...makeSteps(2).slice(1)]} title="T" brand={null} />,
    )
    const used = inlineProps(container)
    expect(used.length).toBeGreaterThan(0)
    expect(used.filter((p) => !GEOMETRY_ONLY.has(p))).toEqual([])
    expect(container.querySelector('style, link[rel="stylesheet"]')).toBeNull()
  })

})
