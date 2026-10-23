import { render } from '@testing-library/react'
import { Plug } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  Appear,
  Arrow,
  arrowGeometry,
  Box,
  Emphasis,
  Frame,
  Label,
  rectStyle,
  SceneLayer,
  SymbolChip,
} from '../../../src/presentation-kit/index.ts'
import { Attribution } from '../../../src/presentation-kit/chrome/Attribution.tsx'
import { Footer } from '../../../src/presentation-kit/chrome/Footer.tsx'
import { Header } from '../../../src/presentation-kit/chrome/Header.tsx'
import { Toc } from '../../../src/presentation-kit/chrome/Toc.tsx'
import { computeEras } from '../../../src/presentation-kit/steps.ts'

const meta = { id: 'a', index: 0, count: 2, era: 'e', title: 'T', caption: 'C' }

const primitives: [string, string, (extra: object) => ReactElement][] = [
  ['box', 'data-presentation-box', (p) => <Box {...p} />],
  ['label', 'data-presentation-label', (p) => <Label {...p} />],
  ['frame', 'data-presentation-frame', (p) => <Frame {...p} />],
  ['emphasis', 'data-presentation-emphasis', (p) => <Emphasis {...p} />],
  ['symbol chip', 'data-presentation-symbol-chip', (p) => <SymbolChip {...p} />],
  ['appear', 'data-presentation-appear', (p) => <Appear {...p} />],
  ['arrow', 'data-presentation-arrow', (p) => <Arrow from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} {...p} />],
  ['scene layer', 'data-presentation-scene-layer', (p) => <SceneLayer {...p} />],
]

describe('stable hooks and pass-through (L-11)', () => {
  it.each(primitives)('%s exposes its hook and forwards class, style and data props', (_n, hook, make) => {
    const { container } = render(make({ className: 'mine', style: { color: 'red' }, 'data-custom': 'x', id: 'dom-id' }))
    const el = container.querySelector(`[${hook}]`) as HTMLElement
    expect(el).not.toBeNull()
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.style.color).toBe('red')
    expect(el.getAttribute('data-custom')).toBe('x')
    expect(el.id).toBe('dom-id')
  })

  it('chrome parts expose hooks and attributes', () => {
    const noop = vi.fn()
    const { container } = render(
      <div>
        <Header meta={meta} mode="browse" brand="b" />
        <Footer meta={meta} mode="browse" titles={['a', 'b']} onPrev={noop} onNext={noop} onJump={noop} />
        <Toc eras={computeEras([{ era: 'x' }])} activeIndex={0} onJump={noop} />
        <Attribution />
      </div>,
    )
    for (const hook of [
      'header', 'brand', 'marker', 'era', 'header-title', 'footer', 'caption', 'progress', 'dot', 'controls',
      'prev', 'next', 'toc', 'toc-entry', 'attribution',
    ]) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })

  it('accepts raw motion elements with a stable layoutId inside a SceneLayer', () => {
    const { container } = render(
      <SceneLayer>
        <motion.div key="raw" layoutId="raw" data-raw="" style={{ position: 'absolute', left: 3, top: 4 }} />
      </SceneLayer>,
    )
    const raw = container.querySelector<HTMLElement>('[data-raw]')!
    expect(raw.parentElement?.closest('[data-presentation-scene-layer]')).not.toBeNull()
    expect(raw.style.left).toBe('3px')
  })

  it('forwards a layoutId into the motion element of Box', () => {
    const { container } = render(<Box layoutId="id-1" data-x="1" />)
    expect(container.firstElementChild!.getAttribute('data-x')).toBe('1')
  })
})

describe('topic-agnostic primitives (C-4)', () => {
  it('renders an optional icon component before children, and nothing when omitted', () => {
    const { container } = render(
      <>
        <Box Icon={Plug} data-testid="with">x</Box>
        <Box data-testid="without">y</Box>
        <SymbolChip Icon={Plug}>z</SymbolChip>
      </>,
    )
    const boxes = container.querySelectorAll('[data-presentation-box]')
    expect(boxes[0].querySelector('svg[data-presentation-icon]')).not.toBeNull()
    expect(boxes[0].firstElementChild?.tagName.toLowerCase()).toBe('svg')
    expect(boxes[1].querySelector('svg')).toBeNull()
    expect(container.querySelector('[data-presentation-symbol-chip] svg')).not.toBeNull()
  })

  it('does not depend on any presentation', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const dir = 'src/presentation-kit/nodes'
    for (const f of readdirSync(dir)) {
      expect(readFileSync(`${dir}/${f}`, 'utf8'), f).not.toMatch(/presentations\//)
    }
  })
})

describe('geometry', () => {
  it('places rects absolutely and ignores a missing rect', () => {
    expect(rectStyle({ x: 1, y: 2, w: 3, h: 4 })).toEqual({ position: 'absolute', left: 1, top: 2, width: 3, height: 4 })
    expect(rectStyle()).toEqual({})
  })

  it('points arrow heads along the path and adds a tail for two-way arrows', () => {
    const one = arrowGeometry({ x: 0, y: 0 }, { x: 100, y: 0 })
    expect(one.path).toBe('M 0 0 L 100 0')
    expect(one.head.startsWith('100,0 ')).toBe(true)
    expect(one.head).toContain('90,5')
    expect(one.tail).toBeNull()
    const two = arrowGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, undefined, true)
    expect(two.tail!.startsWith('0,0 ')).toBe(true)
    expect(two.tail).toContain('10,')
    const curved = arrowGeometry({ x: 0, y: 0 }, { x: 0, y: 100 }, { x: -50, y: 50 })
    expect(curved.path).toBe('M 0 0 Q -50 50 0 100')
    expect(curved.head.startsWith('0,100 ')).toBe(true)
  })

  it('draws an Arrow with currentColor only', () => {
    const { container } = render(<Arrow from={{ x: 0, y: 0 }} to={{ x: 10, y: 0 }} bidirectional />)
    expect(container.querySelector('[data-presentation-arrow-tail]')).not.toBeNull()
    expect(container.querySelector('path')!.getAttribute('stroke')).toBe('currentColor')
  })
})
