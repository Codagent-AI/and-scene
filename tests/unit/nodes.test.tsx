import { render } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, arrowPath, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, ALLOW_OVERLAP } from '../../src/presentation-kit/index.ts'

const first = (container: HTMLElement) => container.firstElementChild as HTMLElement

describe.each([
  ['box', 'Box', (p: object) => <Box {...p}>c</Box>],
  ['label', 'Label', (p: object) => <Label {...p}>c</Label>],
  ['frame', 'Frame', (p: object) => <Frame {...p}>c</Frame>],
  ['emphasis', 'Emphasis', (p: object) => <Emphasis {...p}>c</Emphasis>],
  ['symbol-chip', 'SymbolChip', (p: object) => <SymbolChip {...p}>c</SymbolChip>],
  ['arrow', 'Arrow', (p: object) => <Arrow from={[0, 0]} to={[10, 10]} {...p} />],
])('%s node', (hook, _name, make) => {
  it('exposes a stable hook, entity id, caller className/style/data attributes', () => {
    const { container } = render(make({ id: 'ent', className: 'mine', style: { left: 12, top: 34 }, 'data-extra': 'yes' }))
    const el = first(container)
    expect(el.hasAttribute(`data-presentation-${hook}`)).toBe(true)
    expect(el.getAttribute('data-presentation-entity')).toBe('ent')
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.style.left).toBe('12px')
    expect(el.style.top).toBe('34px')
    expect(el.getAttribute('data-extra')).toBe('yes')
  })

  it('omits the entity hook when no id is given', () => {
    expect(first(render(make({})).container).hasAttribute('data-presentation-entity')).toBe(false)
  })
})

describe('Box glyph', () => {
  it('renders an optional Lucide component alongside its content', () => {
    const { container } = render(<Box id="g" Icon={Star}>text</Box>)
    expect(container.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
    expect(container.textContent).toBe('text')
  })
  it('is optional', () => {
    expect(render(<Box id="g">text</Box>).container.querySelector('svg')).toBeNull()
  })
})

describe('layout primitives', () => {
  it('SceneLayer fills the canvas absolutely and passes caller style through', () => {
    const { container } = render(<SceneLayer style={{ zIndex: 3 }} data-step="2">x</SceneLayer>)
    const el = first(container)
    expect(el.hasAttribute('data-presentation-layer')).toBe(true)
    expect(el.style.position).toBe('absolute')
    expect([el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['0px', '0px', '100%', '100%'])
    expect(el.style.zIndex).toBe('3')
    expect(el.getAttribute('data-step')).toBe('2')
  })

  it('nodes are absolutely placed so overlapping layers never reflow each other', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="a" style={{ left: 0, top: 0 }} />
        <Box id="b" style={{ left: 0, top: 0, zIndex: 2 }} />
      </SceneLayer>,
    )
    const boxes = container.querySelectorAll<HTMLElement>('[data-presentation-box]')
    expect(Array.from(boxes).map((b) => b.style.position)).toEqual(['absolute', 'absolute'])
    expect(boxes[1].style.zIndex).toBe('2')
  })

  it('Appear exposes its hook and passes caller props through', () => {
    const { container } = render(<Appear className="c" data-x="1" />)
    const el = first(container)
    expect(el.hasAttribute('data-presentation-appear')).toBe(true)
    expect(el.className).toBe('c')
    expect(el.getAttribute('data-x')).toBe('1')
  })

  it('exports an allow-overlap marker spread', () => {
    const { container } = render(<div {...ALLOW_OVERLAP} />)
    expect(first(container).hasAttribute('data-presentation-allow-overlap')).toBe(true)
  })
})

describe('arrowPath', () => {
  it('keeps one command structure so any two arrows interpolate', () => {
    const shape = (d: string) => d.replace(/[-\d.]+/g, '#')
    const a = arrowPath({ from: [0, 0], to: [100, 0] })
    const b = arrowPath({ from: [5, 5], to: [50, 90], bidirectional: true, bend: -20 })
    expect(shape(a)).toBe(shape(b))
  })
  it('curves with bend and is straight at zero', () => {
    const straight = arrowPath({ from: [0, 0], to: [100, 0] })
    expect(straight).toContain('Q 50 0 ')
    expect(arrowPath({ from: [0, 0], to: [100, 0], bend: 30 })).toContain('Q 50 30 ')
  })
})
