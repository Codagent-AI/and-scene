// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import type { CSSProperties } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Lightbulb } from 'lucide-react'
import { Appear } from '../../src/presentation-kit/Appear'
import { SceneLayer } from '../../src/presentation-kit/SceneLayer'
import { Arrow } from '../../src/presentation-kit/nodes/Arrow'
import { Box } from '../../src/presentation-kit/nodes/Box'
import { Emphasis } from '../../src/presentation-kit/nodes/Emphasis'
import { Frame } from '../../src/presentation-kit/nodes/Frame'
import { Label } from '../../src/presentation-kit/nodes/Label'
import { SymbolChip } from '../../src/presentation-kit/nodes/SymbolChip'
import { ENTER_DELAY, LAYOUT_T } from '../../src/presentation-kit/constants'
import { motion } from 'motion/react'

vi.mock('motion/react', () => import('./support/motionMock'))

afterEach(() => cleanup())

const byEntity = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)

describe('primitives expose identity and hooks', () => {
  const cases: [string, string, (id: string, extra: { className?: string; style?: CSSProperties }) => JSX.Element][] = [
    ['box', 'box', (id, extra) => <Box id={id} x={1} y={2} width={3} height={4} {...extra} />],
    ['label', 'label', (id, extra) => <Label id={id} x={1} y={2} width={3} height={4} {...extra} />],
    ['frame', 'frame', (id, extra) => <Frame id={id} x={1} y={2} width={3} height={4} {...extra} />],
    ['emphasis', 'emphasis', (id, extra) => <Emphasis id={id} x={1} y={2} width={3} height={4} {...extra} />],
    ['symbol-chip', 'symbol-chip', (id, extra) => <SymbolChip id={id} x={1} y={2} width={3} height={4} {...extra} />],
    ['arrow', 'arrow', (id, extra) => <Arrow id={id} from={{ x: 0, y: 0 }} to={{ x: 50, y: 0 }} {...extra} />],
  ]

  for (const [kind, node, make] of cases) {
    it(`${kind}: forwards identity to the motion layoutId and exposes stable hooks`, () => {
      const { container } = render(make('sample-id', {}))
      const element = byEntity(container, 'sample-id')
      expect(element?.getAttribute('data-presentation-node')).toBe(node)
      expect(element?.getAttribute('data-layout-id')).toBe('sample-id')
    })

    it(`${kind}: passes class and style props through to the rendered element`, () => {
      const { container } = render(make('x', { className: 'hook', style: { zIndex: 4 } }))
      const element = byEntity(container, 'x') as HTMLElement
      expect(element.classList.contains('hook')).toBe(true)
      expect(element.style.zIndex).toBe('4')
      expect(element.style.position).toBe('absolute')
    })
  }

  it('Box passes custom class and style props and places geometry in pixels', () => {
    const { container } = render(
      <Box id="card" x={10} y={20} width={30} height={40} className="card-hook" style={{ zIndex: 2 }}>
        child
      </Box>,
    )
    const element = byEntity(container, 'card') as HTMLElement
    expect(element.className).toBe('card-hook')
    expect(element.style.left).toBe('10px')
    expect(element.style.top).toBe('20px')
    expect(element.style.width).toBe('30px')
    expect(element.style.height).toBe('40px')
    expect(element.style.zIndex).toBe('2')
    expect(element.textContent).toBe('child')
  })

  it('Label, SymbolChip and Frame keep consumer-provided data hooks distinct from kit hooks', () => {
    const { container } = render(
      <div>
        <Label id="label" x={0} y={0} width={1} height={1} className="l" />
        <SymbolChip id="chip" x={0} y={0} width={1} height={1} className="c" />
        <Frame id="frame" x={0} y={0} width={1} height={1} className="f" />
      </div>,
    )
    expect(byEntity(container, 'label')?.className).toBe('l')
    expect(byEntity(container, 'chip')?.className).toBe('c')
    expect(byEntity(container, 'frame')?.className).toBe('f')
  })
})

describe('icons and glyphs', () => {
  it('renders a Lucide glyph component inside a generic Box', () => {
    const { container } = render(<Box id="glyph" x={0} y={0} width={10} height={10} icon={Lightbulb} />)
    expect(container.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
  })

  it('renders no glyph when no icon is given', () => {
    const { container } = render(<Box id="plain" x={0} y={0} width={10} height={10} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('motion props', () => {
  it('Appear fades in after the morph window and is only used for newcomers', () => {
    const { container } = render(
      <Appear>
        <Box id="newcomer" x={0} y={0} width={1} height={1} />
      </Appear>,
    )
    const wrapper = container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(JSON.parse(wrapper.getAttribute('data-motion-initial') ?? 'null')).toEqual({ opacity: 0 })
    expect(JSON.parse(wrapper.getAttribute('data-motion-animate') ?? 'null')).toEqual({ opacity: 1 })
    const transition = JSON.parse(wrapper.getAttribute('data-motion-transition') ?? '{}')
    expect(transition.delay).toBe(ENTER_DELAY)
    expect(transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(transition.duration).toBeGreaterThan(0)
  })

  it('persisting primitives carry a layout transition and an exit', () => {
    const { container } = render(<Box id="persist" x={0} y={0} width={1} height={1} />)
    const element = byEntity(container, 'persist') as HTMLElement
    expect(JSON.parse(element.getAttribute('data-motion-exit') ?? 'null')).toEqual({ opacity: 0 })
    const transition = JSON.parse(element.getAttribute('data-motion-transition') ?? '{}')
    expect(transition.layout.duration).toBe(LAYOUT_T)
  })
})

describe('raw motion elements and coordinate-heavy scenes', () => {
  it('a raw motion element with a stable layoutId keeps its identity while styles update between steps', () => {
    function Scene({ x }: { x: number }) {
      return (
        <SceneLayer name="raw">
          <Box id="primitive" x={x} y={0} width={10} height={10} />
          <motion.div layoutId="raw-element" data-presentation-node="raw" style={{ position: 'absolute', left: x, top: 50 }} />
        </SceneLayer>
      )
    }
    const { container, rerender } = render(<Scene x={5} />)
    const raw = () => container.querySelector('[data-layout-id="raw-element"]') as HTMLElement
    const before = raw()
    rerender(<Scene x={90} />)
    expect(raw()).toBe(before)
    expect(raw().style.left).toBe('90px')
    expect(byEntity(container, 'primitive')?.style.left).toBe('90px')
    expect(byEntity(container, 'primitive')?.getAttribute('data-layout-id')).toBe('primitive')
  })
})

describe('SceneLayer geometry', () => {
  it('absolutely positions each layer so siblings keep their coordinates', () => {
    const { container, rerender } = render(
      <div>
        <SceneLayer name="a">
          <Box id="a1" x={100} y={100} width={10} height={10} />
        </SceneLayer>
      </div>,
    )
    const layerA = container.querySelector('[data-presentation-layer="a"]') as HTMLElement
    const before = byEntity(container, 'a1')?.style.left
    rerender(
      <div>
        <SceneLayer name="a">
          <Box id="a1" x={100} y={100} width={10} height={10} />
        </SceneLayer>
        <SceneLayer name="b">
          <Box id="b1" x={300} y={50} width={10} height={10} />
        </SceneLayer>
      </div>,
    )
    expect(layerA.style.position).toBe('absolute')
    expect(container.querySelector('[data-presentation-layer="b"]')).not.toBeNull()
    expect(byEntity(container, 'a1')?.style.left).toBe(before)
  })
})

describe('arrows', () => {
  it('sizes its box to the endpoints and marks both ends when bidirectional', () => {
    const { container } = render(
      <Arrow id="link" from={{ x: 100, y: 40 }} to={{ x: 20, y: 40 }} bidirectional />,
    )
    const box = byEntity(container, 'link') as HTMLElement
    expect(box.style.width).toBe(`${80 + 12}px`)
    const line = container.querySelector('[data-presentation-arrow-line]') as SVGLineElement
    expect(line.getAttribute('markerStart') ?? line.getAttribute('marker-start')).not.toBeNull()
  })
})
