// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import {
  Appear, Arrow, Box, Emphasis, Footer, Frame, Header, Label, Presentation, SceneLayer, Stage, SymbolChip, Toc,
} from '../../src/presentation-kit'
import { makeSteps, setViewport } from './helpers/fixtures'

/** Layout, geometry and motion properties the kit may set inline (see the lead's style ruling). */
const ALLOWED_STYLE = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'display', 'flex', 'flex-direction',
  'align-items', 'justify-content', 'overflow', 'z-index', 'pointer-events', 'transform', 'transform-origin',
  'opacity', 'overflow-x', 'overflow-y', 'flex-grow', 'flex-shrink', 'flex-basis',
])
const ALLOWED_ATTRS = /^(data-|aria-|id$|class$|style$|href$|target$|rel$|type$|d$|fill$|stroke$|orient$|marker|ref[XY]$|viewBox$|role$)/

function violations(container: HTMLElement): string[] {
  const found: string[] = []
  for (const el of container.querySelectorAll<HTMLElement | SVGElement>('*')) {
    if (el.closest('[data-presentation-icon]')) continue // glyph markup belongs to the icon library
    for (let i = 0; i < el.style.length; i++) {
      const prop = el.style.item(i)
      if (!ALLOWED_STYLE.has(prop)) found.push(`${el.tagName}: style ${prop}`)
    }
    for (const attr of el.getAttributeNames()) {
      if (!ALLOWED_ATTRS.test(attr)) found.push(`${el.tagName}: attribute ${attr}`)
    }
    if (el.getAttribute('class')) found.push(`${el.tagName}: class ${el.getAttribute('class')}`)
    if (el.getAttribute('fill') && !['none', 'context-stroke'].includes(el.getAttribute('fill')!)) found.push(`${el.tagName}: fill`)
    if (el.getAttribute('stroke') && el.getAttribute('stroke') !== 'currentColor') found.push(`${el.tagName}: stroke`)
  }
  if (container.querySelector('style, link[rel="stylesheet"]')) found.push('stylesheet element')
  return found
}

const everyPrimitive = (
  <>
    <Box id="box" x={1} y={2} width={3} height={4} Icon={Check}>box</Box>
    <Label id="label">label</Label>
    <Frame id="frame" />
    <Emphasis id="emph" />
    <SymbolChip id="chip" symbol="s" Icon={Check} />
    <Arrow id="arrow" from={[0, 0]} to={[5, 5]} bend={3} bidirectional />
    <Appear>appear</Appear>
    <SceneLayer>
      <Box key="in" id="in" />
    </SceneLayer>
  </>
)

describe('zero visual defaults', () => {
  it('every primitive renders only geometry and motion styling without caller props', () => {
    const { container } = render(everyPrimitive)
    expect(violations(container)).toEqual([])
    expect(container.querySelectorAll('[data-presentation-node]').length).toBeGreaterThan(5)
  })

  it.each(['browse', 'present'] as const)('Presentation chrome in %s mode adds no visual styling', (mode) => {
    setViewport(1440, 900)
    const { container } = render(
      <Presentation steps={makeSteps(['a', 'a', 'b'], () => everyPrimitive)} title="Deck" initialMode={mode} />,
    )
    expect(violations(container)).toEqual([])
  })

  it('individual chrome parts and the stage add no visual styling', () => {
    const { container } = render(
      <>
        <Header mode="browse" index={0} count={2} era="e" title="t" />
        <Toc eras={['a', 'b']} activeEra="a" onGoTo={() => {}} />
        <Footer mode="browse" index={0} stepIds={['a', 'b']} stepTitles={['A', 'B']} title="t" caption="c" onPrev={() => {}} onNext={() => {}} onGoTo={() => {}} />
        <Stage step={makeSteps(['a'])[0]} mode="present" />
      </>,
    )
    expect(violations(container)).toEqual([])
  })

  it('detects forbidden defaults (control for the checker)', () => {
    const { container } = render(<div style={{ color: 'red', margin: 4 }} className="x" />)
    expect(violations(container).length).toBeGreaterThanOrEqual(3)
  })
})

describe('style hooks and passthrough', () => {
  const cases: [string, (props: Record<string, unknown>) => ReactElement][] = [
    ['Box', (props) => <Box id="n" {...props} />],
    ['Label', (props) => <Label id="n" {...props} />],
    ['Frame', (props) => <Frame id="n" {...props} />],
    ['Emphasis', (props) => <Emphasis id="n" {...props} />],
    ['SymbolChip', (props) => <SymbolChip id="n" {...props} />],
    ['Arrow', (props) => <Arrow id="n" from={[0, 0]} to={[1, 1]} {...props} />],
  ]

  it.each(cases)('%s exposes identity/kind hooks and passes className, data-* and style through', (_, make) => {
    const { container } = render(
      make({ className: 'mine', 'data-custom': 'yes', style: { left: 99, color: 'red' }, x: 1 }),
    )
    const node = container.querySelector('[data-presentation-entity="n"]') as HTMLElement
    expect(node.getAttribute('data-presentation-node')).toBeTruthy()
    expect(node.getAttribute('class')).toContain('mine')
    expect(node.getAttribute('data-custom')).toBe('yes')
    expect(node.style.color).toBe('red')
    if (node.tagName !== 'svg') expect(node.style.left).toBe('99px') // caller style wins over x
  })

  it('exposes stable hooks on stage, scene and chrome', () => {
    setViewport(1440, 900)
    const { container } = render(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" className="mine" />)
    for (const hook of [
      'root', 'header', 'brand', 'marker', 'title', 'caption', 'footer', 'controls', 'prev', 'next', 'progress',
      'progress-item', 'toc', 'toc-entry', 'stage', 'canvas', 'scene', 'attribution', 'era', 'step-number',
    ]) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
    expect(container.querySelector('[data-presentation-root]')?.className).toBe('mine')
  })

  it('Appear and SceneLayer pass caller attributes and style through', () => {
    const { container } = render(
      <>
        <Appear className="a" data-x="1" style={{ opacity: 0.5 }} />
        <SceneLayer className="l" data-y="2" style={{ zIndex: 3 }} />
      </>,
    )
    expect(container.querySelector('[data-presentation-appear]')?.getAttribute('data-x')).toBe('1')
    expect(container.querySelector('.l')?.getAttribute('data-y')).toBe('2')
    expect((container.querySelector('.l') as HTMLElement).style.zIndex).toBe('3')
  })
})
