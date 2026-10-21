import { render, screen } from '@testing-library/react'
import { Check, Layers } from 'lucide-react'
import { motion } from 'motion/react'
import { describe, expect, it } from 'vitest'
import { Header } from '../chrome/Header'
import { Footer } from '../chrome/Footer'
import { Toc } from '../chrome/Toc'
import { Appear } from '../nodes/Appear'
import { Arrow } from '../nodes/Arrow'
import { arrowPath } from '../nodes/arrowPath'
import { Box } from '../nodes/Box'
import { Emphasis } from '../nodes/Emphasis'
import { Frame } from '../nodes/Frame'
import { Label } from '../nodes/Label'
import { SceneLayer } from '../nodes/SceneLayer'
import { SymbolChip } from '../nodes/SymbolChip'
import { ENTER_DELAY } from '../constants'
import { enterProps } from '../nodes/enter'
import { makeSteps } from './fixtures'

const style = { left: 11, top: 22, width: 33, height: 44 }

describe('node primitives', () => {
  const nodes = [
    ['box', Box],
    ['label', Label],
    ['frame', Frame],
    ['emphasis', Emphasis],
    ['symbol-chip', SymbolChip],
  ] as const

  it.each(nodes)('%s forwards class, style, and custom data hooks and keeps its built-in hooks', (kind, Component) => {
    const { container } = render(
      <Component entity={`e-${kind}`} className="mine" style={style} data-presentation-custom="yes">
        content
      </Component>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
    expect(el.getAttribute('data-presentation-entity')).toBe(`e-${kind}`)
    expect(el.getAttribute('data-presentation-custom')).toBe('yes')
    expect(el.classList.contains('mine')).toBe(true)
    expect([el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['11px', '22px', '33px', '44px'])
    expect(el.textContent).toBe('content')
  })

  it('Box renders an optional Lucide icon only when requested', () => {
    const { container, rerender } = render(<Box entity="b">text</Box>)
    expect(container.querySelector('svg')).toBeNull()
    rerender(<Box entity="b" Icon={Layers}>text</Box>)
    expect(container.querySelector('svg[data-presentation-icon]')).not.toBeNull()
    expect(container.firstElementChild!.getAttribute('data-presentation-entity')).toBe('b')
  })

  it('SymbolChip shows an icon, or a text symbol', () => {
    const { container, rerender } = render(<SymbolChip entity="s" Icon={Check} />)
    expect(container.querySelector('svg')).not.toBeNull()
    rerender(<SymbolChip entity="s" symbol="★" />)
    expect(container.firstElementChild!.textContent).toBe('★')
  })

  it('Arrow draws a path in design coordinates and supports bend and two heads', () => {
    const { container } = render(
      <Arrow entity="a" className="mine" bidirectional bend={30} from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} />,
    )
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-presentation-node')).toBe('arrow')
    expect(svg.getAttribute('data-presentation-entity')).toBe('a')
    expect(svg.classList.contains('mine')).toBe(true)
    expect(container.querySelector('path[fill="none"]')!.getAttribute('marker-start')).toMatch(/^url\(#/)
    expect(arrowPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0)).toBe('M 0 0 Q 50 0 100 0')
    expect(arrowPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 30)).toBe('M 0 0 Q 50 30 100 0')
  })

  it('Appear fades in after persisting entities settle', () => {
    expect(enterProps.animate.transition.delay).toBeGreaterThanOrEqual(ENTER_DELAY)
    const { container } = render(<Appear className="x">hi</Appear>)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-presentation-node')).toBe('appear')
    expect(el.style.opacity).toBe('0')
  })

  it('SceneLayer absolutely positions a fixed-size layer, so layers never reflow each other', () => {
    const { container } = render(
      <>
        <SceneLayer data-a="" />
        <SceneLayer data-b="" style={{ zIndex: 2 }} />
      </>,
    )
    const layers = Array.from(container.querySelectorAll<HTMLElement>('[data-presentation-layer]'))
    expect(layers).toHaveLength(2)
    for (const layer of layers) {
      expect([layer.style.position, layer.style.width, layer.style.height]).toEqual(['absolute', '880px', '380px'])
    }
    expect(layers[1].style.zIndex).toBe('2')
  })

  it('supports raw motion elements with a stable layoutId next to primitives', () => {
    const { container, rerender } = render(
      <SceneLayer>
        <Box key="a" entity="a" style={style} />
        <motion.div key="r" layoutId="raw" data-presentation-entity="raw" style={{ position: 'absolute', left: 1 }} />
      </SceneLayer>,
    )
    const raw = container.querySelector('[data-presentation-entity="raw"]') as HTMLElement
    rerender(
      <SceneLayer>
        <Box key="a" entity="a" style={style} />
        <motion.div key="r" layoutId="raw" data-presentation-entity="raw" style={{ position: 'absolute', left: 99 }} />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-entity="raw"]')).toBe(raw)
    expect(raw.style.left).toBe('99px')
  })
})

describe('chrome pieces', () => {
  const steps = makeSteps(4)
  const noop = () => {}

  it('Header, Footer, and Toc render their stable hooks', () => {
    const { container } = render(
      <>
        <Header mode="browse" marker={2} total={4} title="T" brand={<b>brand</b>} />
        <Footer mode="browse" steps={steps} index={1} wide onJump={noop} onPrev={noop} onNext={noop} />
        <Toc steps={steps} index={0} onJump={noop} />
      </>,
    )
    for (const hook of [
      'header',
      'brand',
      'marker',
      'title',
      'footer',
      'caption',
      'progress',
      'progress-dot',
      'controls',
      'prev',
      'next',
      'toc',
      'toc-entry',
    ]) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
    expect(screen.getByText('brand')).toBeTruthy()
  })
})
