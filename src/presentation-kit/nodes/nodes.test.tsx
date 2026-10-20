import { render } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Attribution } from '../chrome/Attribution.tsx'
import { Footer } from '../chrome/Footer.tsx'
import { Header } from '../chrome/Header.tsx'
import { Toc } from '../chrome/Toc.tsx'
import { Appear } from './Appear.tsx'
import { Arrow } from './Arrow.tsx'
import { arrowGeometry } from './arrowGeometry.ts'
import { Box } from './Box.tsx'
import { Emphasis } from './Emphasis.tsx'
import { Frame } from './Frame.tsx'
import { Label } from './Label.tsx'
import { SceneLayer } from './SceneLayer.tsx'
import { SymbolChip } from './SymbolChip.tsx'

const custom = { className: 'mine', 'data-extra': 'yes', style: { zIndex: 4 } } as const

const cases: [string, string, ReactElement][] = [
  ['box', 'data-presentation-box', <Box layoutId="b" {...custom} />],
  ['label', 'data-presentation-label', <Label layoutId="l" {...custom} />],
  ['symbol chip', 'data-presentation-symbol-chip', <SymbolChip layoutId="c" symbol="x" {...custom} />],
  ['frame', 'data-presentation-frame', <Frame layoutId="f" x={1} y={2} width={3} height={4} {...custom} />],
  ['emphasis', 'data-presentation-emphasis', <Emphasis layoutId="e" x={1} y={2} width={3} height={4} {...custom} />],
  ['arrow', 'data-presentation-arrow', <Arrow layoutId="a" from={{ x: 0, y: 0 }} to={{ x: 50, y: 20 }} {...custom} />],
  ['appear', 'data-presentation-appear', <Appear {...custom} />],
  ['scene layer', 'data-presentation-scene-layer', <SceneLayer {...custom} />],
]

describe.each(cases)('%s primitive', (_name, hook, element) => {
  it('exposes its own hook and forwards class, style, and data attributes', () => {
    const { container } = render(element)
    const node = container.querySelector<HTMLElement | SVGElement>(`[${hook}]`)!
    expect(node).not.toBeNull()
    expect(node.getAttribute('class')).toContain('mine')
    expect(node.getAttribute('data-extra')).toBe('yes')
    expect(node.style.zIndex).toBe('4')
  })
})

describe('entity identity', () => {
  it.each([
    ['box', <Box layoutId="same" />],
    ['label', <Label layoutId="same" />],
    ['chip', <SymbolChip layoutId="same" symbol="s" />],
    ['frame', <Frame layoutId="same" x={0} y={0} width={1} height={1} />],
    ['emphasis', <Emphasis layoutId="same" x={0} y={0} width={1} height={1} />],
    ['arrow', <Arrow layoutId="same" from={{ x: 0, y: 0 }} to={{ x: 9, y: 9 }} />],
  ])('%s carries its stable entity id', (_n, element) => {
    const { container } = render(element)
    expect(container.querySelector('[data-presentation-id]')!.getAttribute('data-presentation-id')).toBe('same')
  })
})

describe('Box glyph', () => {
  it('renders an optional Lucide icon supplied as a component', () => {
    const withIcon = render(<Box layoutId="g" Icon={Sparkles}>hi</Box>)
    expect(withIcon.container.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(withIcon.container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    withIcon.unmount()
    const without = render(<Box layoutId="g">hi</Box>)
    expect(without.container.querySelector('[data-presentation-glyph]')).toBeNull()
    expect(without.container.querySelector('[data-presentation-box]')!.getAttribute('data-presentation-id')).toBe('g')
  })
})

describe('coordinate-heavy scenes', () => {
  it('renders raw motion elements next to primitives', () => {
    const { container } = render(
      <SceneLayer>
        <motion.div layoutId="raw" data-raw="1" style={{ position: 'absolute', left: 3, top: 4 }} />
        <Box layoutId="prim" />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-raw]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-id="prim"]')).not.toBeNull()
  })
})

describe('SceneLayer', () => {
  it('absolutely positions overlapping entities without adding flow spacing', () => {
    const { container } = render(
      <SceneLayer data-testid="layer">
        <Frame layoutId="one" x={10} y={10} width={100} height={100} />
        <Frame layoutId="two" x={40} y={40} width={100} height={100} />
      </SceneLayer>,
    )
    const layer = container.querySelector<HTMLElement>('[data-presentation-scene-layer]')!
    expect(layer.style.position).toBe('absolute')
    expect(layer.style.inset).toBe('0px')
    const [a, b] = [...container.querySelectorAll<HTMLElement>('[data-presentation-frame]')]
    expect([a.style.left, a.style.top, a.style.position]).toEqual(['10px', '10px', 'absolute'])
    expect([b.style.left, b.style.top, b.style.position]).toEqual(['40px', '40px', 'absolute'])
    expect(layer.style.margin).toBe('')
    expect(layer.style.padding).toBe('')
  })
})

describe('arrow geometry', () => {
  it('covers both endpoints with room for heads', () => {
    const g = arrowGeometry({ x: 100, y: 50 }, { x: 20, y: 90 })
    expect(g.left).toBeLessThanOrEqual(20)
    expect(g.top).toBeLessThanOrEqual(50)
    expect(g.left + g.width).toBeGreaterThanOrEqual(100)
    expect(g.top + g.height).toBeGreaterThanOrEqual(90)
    expect(g.heads).toHaveLength(1)
    expect(arrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, true).heads).toHaveLength(2)
  })
})

describe('chrome hooks', () => {
  const steps = [
    { id: 'a', era: 'x', title: 'A', caption: 'cA' },
    { id: 'b', era: 'y', title: 'B', caption: 'cB' },
  ]
  it('header, footer, toc, and attribution each expose their hook', () => {
    const noop = () => {}
    const { container } = render(
      <>
        <Header step={steps[0]} index={0} mode="browse" title="Deck" />
        <Footer steps={steps} index={0} mode="browse" wide onJump={noop} onNext={noop} onPrev={noop} onToggleMode={noop} />
        <Toc steps={steps} index={0} onJump={noop} />
        <Attribution />
      </>,
    )
    for (const hook of [
      'header', 'marker', 'brand-slot', 'deck-title', 'footer', 'title', 'caption', 'controls', 'progress',
      'progress-item', 'prev', 'next', 'mode-toggle', 'toc', 'toc-item', 'attribution',
    ]) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })
})
