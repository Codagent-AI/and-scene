import { render } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'

const at = { x: 10, y: 20, w: 30, h: 40 }

describe('primitives expose stable hooks and pass author props through (L-11, I-8)', () => {
  const cases: [string, string, (p: Record<string, unknown>) => React.ReactElement][] = [
    ['box', 'data-presentation-box', (p) => <Box entity="b" {...p} />],
    ['label', 'data-presentation-label', (p) => <Label entity="l" {...p} />],
    ['arrow', 'data-presentation-arrow', (p) => <Arrow entity="a" from={[0, 0]} to={[50, 0]} {...p} />],
    ['frame', 'data-presentation-frame', (p) => <Frame entity="f" {...p} />],
    ['emphasis', 'data-presentation-emphasis', (p) => <Emphasis entity="m" {...p} />],
    ['symbol chip', 'data-presentation-symbol-chip', (p) => <SymbolChip entity="s" symbol="*" {...p} />],
    ['appear', 'data-presentation-appear', (p) => <Appear {...p} />],
    ['scene layer', 'data-presentation-scene-layer', (p) => <SceneLayer {...p} />],
  ]
  it.each(cases)('%s', (_name, hook, make) => {
    const { container } = render(make({ className: 'mine', 'data-custom': 'yes', style: { opacity: 0.5, zIndex: 3 } }))
    const el = container.querySelector(`[${hook}]`) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.className).toBe('mine')
    expect(el.getAttribute('data-custom')).toBe('yes')
    expect(el.style.zIndex).toBe('3')
  })
  it('stamps the entity id and lets author style override placement', () => {
    const { container } = render(<Box entity="x" at={at} style={{ left: 99 }} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-presentation-entity')).toBe('x')
    expect(el.style.left).toBe('99px')
    expect([el.style.top, el.style.width, el.style.height, el.style.position]).toEqual(['20px', '30px', '40px', 'absolute'])
  })
  it('layers never alter each other and stack by z', () => {
    const { container } = render(<><SceneLayer z={1} id="a" /><SceneLayer z={5} id="b" /></>)
    const [a, b] = [...container.querySelectorAll<HTMLElement>('[data-presentation-scene-layer]')]
    for (const l of [a!, b!]) expect([l.style.position, l.style.left, l.style.top, l.style.width, l.style.height]).toEqual(['absolute', '0px', '0px', '100%', '100%'])
    expect([a!.style.zIndex, b!.style.zIndex]).toEqual(['1', '5'])
  })
  it('keeps explicit coordinates for overlapping entities (L-9, I-6)', () => {
    const { container, rerender } = render(<SceneLayer><Box entity="p" at={{ x: 0, y: 0, w: 100, h: 100 }} /><Box entity="q" at={{ x: 50, y: 50, w: 100, h: 100 }} /></SceneLayer>)
    rerender(<SceneLayer><Box entity="p" at={{ x: 0, y: 0, w: 100, h: 100 }} /><Box entity="q" at={{ x: 60, y: 60, w: 100, h: 100 }} /></SceneLayer>)
    const [p, q] = [...container.querySelectorAll<HTMLElement>('[data-presentation-box]')]
    expect([p!.style.left, p!.style.top]).toEqual(['0px', '0px'])
    expect([q!.style.left, q!.style.top]).toEqual(['60px', '60px'])
  })
})

describe('Box glyph (C-2)', () => {
  it('renders an optional Lucide icon component with content and hooks intact', () => {
    const { container, rerender } = render(<Box entity="g" Icon={Star} data-extra="1">hello</Box>)
    const box = container.firstElementChild as HTMLElement
    expect(box.querySelector('svg[data-presentation-box-icon]')).toBeTruthy()
    expect(box.textContent).toBe('hello')
    expect(box.getAttribute('data-extra')).toBe('1')
    rerender(<Box entity="g" data-extra="1">hello</Box>)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstElementChild?.getAttribute('data-presentation-entity')).toBe('g')
  })
})

describe('Arrow', () => {
  it('draws heads at both ends when bidirectional, using currentColor only', () => {
    const { container } = render(<Arrow entity="a" from={[0, 0]} to={[100, 0]} bidirectional curve={20} />)
    expect(container.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i)
  })
  it('draws a single head by default', () => {
    const { container } = render(<Arrow entity="a" from={[0, 0]} to={[100, 40]} />)
    expect(container.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(1)
  })
})
