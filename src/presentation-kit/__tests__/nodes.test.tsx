import { cleanup, render } from '@testing-library/react'
import { Anchor } from 'lucide-react'
import { motion } from 'motion/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../nodes/index.ts'
import { appearProps } from '../nodes/appearProps.ts'
import { arcControl, arrowHeadPath, arrowShaftPath } from '../nodes/arrowGeometry.ts'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants.ts'
import { Footer } from '../chrome/Footer.tsx'
import { Header } from '../chrome/Header.tsx'
import { Toc } from '../chrome/Toc.tsx'
import { makeSteps } from './helpers.ts'

afterEach(cleanup)

type Case = [name: string, hook: string, element: React.ReactElement]
const cases: Case[] = [
  ['Box', 'data-presentation-box', <Box id="a" x={10} y={20} w={30} h={40} className="mine" data-extra="1" style={{ zIndex: 3 }} />],
  ['Label', 'data-presentation-label', <Label id="a" x={10} y={20} w={30} h={40} className="mine" data-extra="1" style={{ zIndex: 3 }} />],
  ['Frame', 'data-presentation-frame', <Frame id="a" x={10} y={20} w={30} h={40} className="mine" data-extra="1" style={{ zIndex: 3 }} />],
  ['Emphasis', 'data-presentation-emphasis', <Emphasis id="a" x={10} y={20} w={30} h={40} className="mine" data-extra="1" style={{ zIndex: 3 }} />],
  ['SymbolChip', 'data-presentation-symbol-chip', <SymbolChip id="a" symbol="*" x={10} y={20} w={30} h={40} className="mine" data-extra="1" style={{ zIndex: 3 }} />],
]

describe.each(cases)('%s', (_name, hook, element) => {
  it('exposes its role hook and entity identity, and forwards class, style and data props', () => {
    const { container } = render(element)
    const el = container.querySelector(`[${hook}]`) as HTMLElement
    expect(el).not.toBeNull()
    expect(el.getAttribute('data-presentation-entity')).toBe('a')
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.getAttribute('data-extra')).toBe('1')
    expect(el.style.zIndex).toBe('3')
  })

  it('places itself at literal canvas coordinates and supplies no visual styling', () => {
    const { container } = render(element)
    const el = container.querySelector(`[${hook}]`) as HTMLElement
    expect(el.style.position).toBe('absolute')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('30px')
    expect(el.style.height).toBe('40px')
    for (const prop of ['color', 'background', 'border', 'boxShadow', 'fontFamily', 'fontSize', 'padding', 'borderRadius']) {
      expect(el.style[prop as 'color']).toBe('')
    }
  })
})

describe('Box', () => {
  it('renders a supplied Lucide glyph and the label, and works without an icon', () => {
    const { container, rerender } = render(<Box id="a" icon={Anchor} label="Hi" />)
    expect(container.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-box-label]')?.textContent).toBe('Hi')
    rerender(<Box id="a" />)
    expect(container.querySelector('[data-presentation-box]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-glyph]')).toBeNull()
  })

  it('does not position itself when no coordinates are given', () => {
    const { container } = render(<Box id="a" />)
    expect((container.firstElementChild as HTMLElement).style.position).toBe('')
  })
})

describe('Arrow', () => {
  it('draws a shaft and one head, or two for a bidirectional arrow, without fill or stroke of its own', () => {
    const one = render(<Arrow id="r" from={[0, 0]} to={[100, 0]} />)
    expect(one.container.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(1)
    expect(one.container.querySelector('[data-presentation-arrow-line]')).not.toBeNull()
    one.unmount()
    const two = render(<Arrow id="r" from={[0, 0]} to={[100, 0]} bidirectional className="x" data-k="v" />)
    expect(two.container.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    const svg = two.container.querySelector('[data-presentation-arrow]') as SVGElement
    expect(svg.classList.contains('x')).toBe(true)
    expect(svg.getAttribute('data-k')).toBe('v')
    expect(two.container.innerHTML).not.toMatch(/stroke|fill=|color/)
  })

  it('computes straight and bent shafts and a head at the tip', () => {
    expect(arrowShaftPath([0, 0], [10, 0], 0)).toBe('M 0 0 L 10 0')
    expect(arrowShaftPath([0, 0], [10, 0], 5)).toBe('M 0 0 Q 5 5 10 0')
    expect(arcControl([0, 0], [10, 0], 0)).toEqual([5, 0])
    expect(arrowHeadPath([0, 0], [10, 0], 4).startsWith('M 10 0')).toBe(true)
  })
})

describe('Appear', () => {
  it('fades newcomers in after persisting entities settle', () => {
    const props = appearProps()
    expect(props.initial).toEqual({ opacity: 0 })
    expect(props.animate).toEqual({ opacity: 1 })
    expect(props.transition.delay).toBe(ENTER_DELAY)
    expect(props.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(props.transition.duration).toBe(ENTER_T)
    expect(appearProps(2).transition.delay).toBe(2)
  })

  it('does not restart its entry when re-rendered', () => {
    const { container, rerender } = render(
      <Appear>
        <i>a</i>
      </Appear>,
    )
    const node = container.querySelector('[data-presentation-appear]') as HTMLElement
    rerender(
      <Appear>
        <i>b</i>
      </Appear>,
    )
    expect(container.querySelector('[data-presentation-appear]')).toBe(node)
    expect(node.textContent).toBe('b')
  })
})

describe('SceneLayer', () => {
  it('absolutely fills the canvas without styling beyond geometry', () => {
    const { container } = render(<SceneLayer className="l" />)
    const layer = container.querySelector('[data-presentation-scene-layer]') as HTMLElement
    expect(layer.style.position).toBe('absolute')
    expect(layer.classList.contains('l')).toBe(true)
  })
})

describe('chrome hooks', () => {
  const steps = makeSteps(3)
  it('forwards stable hooks from Header, Footer and Toc', () => {
    const header = render(<Header mode="browse" number={2} era="e" title="T" brand="B" />)
    for (const hook of ['header', 'brand', 'marker', 'number', 'era', 'title']) {
      expect(header.container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
    header.unmount()
    const footer = render(<Footer mode="browse" steps={steps} index={0} onPrev={() => {}} onNext={() => {}} onJump={() => {}} />)
    for (const hook of ['footer', 'caption', 'progress', 'progress-dot', 'controls', 'prev', 'next']) {
      expect(footer.container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
    footer.unmount()
    const toc = render(<Toc steps={steps} index={0} onJump={() => {}} />)
    for (const hook of ['toc', 'toc-entry']) {
      expect(toc.container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })
})

describe('persisting entity (L-4)', () => {
  it('keeps one DOM node and updates position, size, label and emphasis in place', () => {
    const { container, rerender } = render(<Box id="e" x={10} y={20} w={30} h={40} label="old" data-presentation-emphasis-on="false" />)
    const node = container.querySelector('[data-presentation-entity="e"]') as HTMLElement
    rerender(<Box id="e" x={110} y={120} w={130} h={140} label="new" data-presentation-emphasis-on="true" />)
    expect(container.querySelector('[data-presentation-entity="e"]')).toBe(node)
    expect([node.style.left, node.style.top, node.style.width, node.style.height]).toEqual(['110px', '120px', '130px', '140px'])
    expect(node.querySelector('[data-presentation-box-label]')?.textContent).toBe('new')
    expect(node.getAttribute('data-presentation-emphasis-on')).toBe('true')
  })

  it('supports raw motion elements with a stable layoutId beside the primitives', () => {
    const { container } = render(
      <SceneLayer>
        <motion.div key="raw" layoutId="raw" data-raw="" style={{ position: 'absolute', left: 5, top: 6 }} />
        <Box key="box" id="box" />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-raw]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-box]')).not.toBeNull()
  })
})
