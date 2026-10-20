// @vitest-environment jsdom
import { createElement } from 'react'
import { render, waitFor } from '@testing-library/react'
import { Star } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY } from '../constants.ts'
import { Appear } from './Appear.tsx'
import { Arrow } from './Arrow.tsx'
import { Box } from './Box.tsx'
import { Emphasis } from './Emphasis.tsx'
import { Frame } from './Frame.tsx'
import { Label } from './Label.tsx'
import { SceneLayer } from './SceneLayer.tsx'
import { SymbolChip } from './SymbolChip.tsx'

const first = (container: HTMLElement) => container.firstElementChild as HTMLElement

describe.each([
  ['Box', Box, 'box'],
  ['Label', Label, 'label'],
  ['Frame', Frame, 'frame'],
  ['Emphasis', Emphasis, 'emphasis'],
  ['SymbolChip', SymbolChip, 'symbol-chip'],
] as const)('%s', (_name, Primitive, kind) => {
  it('exposes stable entity hooks and passes class, style and data attributes through', () => {
    const { container } = render(
      createElement(Primitive as typeof Box, { id: 'thing', className: 'mine', style: { left: 5 }, 'data-extra': 'x' } as never, 'hi'),
    )
    const el = first(container)
    expect(el.getAttribute('data-presentation-entity')).toBe('thing')
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
    expect(el.className).toBe('mine')
    expect(el.style.left).toBe('5px')
    expect(el.getAttribute('data-extra')).toBe('x')
  })

  it('keeps the same element and identity while its state changes in place', () => {
    const view = render(createElement(Primitive as typeof Box, { id: 'thing', style: { left: 0, top: 0 } } as never))
    const el = first(view.container)
    view.rerender(createElement(Primitive as typeof Box, { id: 'thing', style: { left: 120, top: 40 } } as never, 'renamed'))
    expect(first(view.container)).toBe(el)
    expect(el.style.left).toBe('120px')
    expect(el.textContent).toBe('renamed')
  })

  it('ships no visual style of its own', () => {
    const { container } = render(createElement(Primitive as typeof Box, { id: 'thing' } as never, 'x'))
    const el = first(container)
    for (const prop of ['color', 'background', 'border', 'boxShadow', 'fontFamily', 'padding', 'margin'] as const) {
      expect(el.style[prop]).toBe('')
    }
  })
})

describe('Box', () => {
  it('renders a Lucide icon passed as a component, and none when omitted', () => {
    const { container, rerender } = render(<Box id="b" icon={Star}>x</Box>)
    expect(container.querySelector('svg[data-presentation-icon]')).not.toBeNull()
    rerender(<Box id="b">x</Box>)
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('Arrow', () => {
  it('draws an svg line with a head, a second head when two-way, and no color of its own', () => {
    const { container, rerender } = render(<Arrow id="a" from={{ x: 1, y: 2 }} to={{ x: 30, y: 40 }} className="mine" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('data-presentation-entity')).toBe('a')
    expect(svg.getAttribute('data-presentation-node')).toBe('arrow')
    expect(svg.getAttribute('class')).toBe('mine')
    const line = container.querySelector('[data-presentation-arrow-line]') as SVGLineElement
    expect(line.getAttribute('marker-end')).toMatch(/^url\(#/)
    expect(line.getAttribute('marker-start')).toBeNull()
    expect(line.getAttribute('stroke')).toBe('currentColor')
    rerender(<Arrow id="a" twoWay from={{ x: 1, y: 2 }} to={{ x: 30, y: 40 }} />)
    expect(container.querySelector('[data-presentation-arrow-line]')?.getAttribute('marker-start')).toMatch(/^url\(#/)
  })
})

describe('SceneLayer', () => {
  it('is absolutely positioned and leaves child coordinates, including overlaps, untouched', () => {
    const { container } = render(
      <div>
        <SceneLayer className="a">
          <div id="one" style={{ position: 'absolute', left: 10, top: 10, width: 100, height: 50 }} />
          <div id="two" style={{ position: 'absolute', left: 60, top: 30, width: 100, height: 50 }} />
        </SceneLayer>
        <SceneLayer className="b" />
      </div>,
    )
    const [a, b] = [...container.querySelectorAll('[data-presentation-scene-layer]')] as HTMLElement[]
    expect([a.style.position, b.style.position]).toEqual(['absolute', 'absolute'])
    expect(a.className).toBe('a')
    expect((container.querySelector('#one') as HTMLElement).style.left).toBe('10px')
    expect((container.querySelector('#two') as HTMLElement).style.left).toBe('60px')
    expect((container.querySelector('#two') as HTMLElement).style.top).toBe('30px')
  })
})

describe('raw motion children', () => {
  it('are accepted inside a SceneLayer with literal coordinates and layoutId', () => {
    const { container } = render(
      <SceneLayer>
        <motion.div layoutId="raw" data-presentation-entity="raw" style={{ position: 'absolute', left: 33, top: 44 }} />
      </SceneLayer>,
    )
    expect((container.querySelector('[data-presentation-entity="raw"]') as HTMLElement).style.left).toBe('33px')
  })
})

describe('Appear', () => {
  it('starts hidden and only becomes visible after the layout morph has had time to finish', async () => {
    expect(ENTER_DELAY).toBeGreaterThan(0.6)
    const { container } = render(<Appear><span>new</span></Appear>)
    const el = first(container)
    expect(el.style.opacity).toBe('0')
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(Number(el.style.opacity)).toBe(0)
    await waitFor(() => expect(Number(el.style.opacity)).toBe(1), { timeout: 3000 })
  })

  it('keeps a departing child mounted while it animates out, then removes it', async () => {
    const view = render(
      <AnimatePresence>
        <Appear key="x" delay={0}><span data-testid="gone">bye</span></Appear>
      </AnimatePresence>,
    )
    await waitFor(() => expect(Number(first(view.container).style.opacity)).toBe(1), { timeout: 3000 })
    view.rerender(<AnimatePresence>{null}</AnimatePresence>)
    expect(view.container.querySelector('[data-testid="gone"]')).not.toBeNull()
    await waitFor(() => expect(view.container.querySelector('[data-testid="gone"]')).toBeNull(), { timeout: 3000 })
  })
})
