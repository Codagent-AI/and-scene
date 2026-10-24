// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { Heart } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, arrowPath } from '../../src/presentation-kit/index.ts'

const sentinel = { className: 'sentinel-class', style: { outlineWidth: '5px' }, 'data-sentinel': 'yes' }

const matrix: [string, string, (props: Record<string, unknown>) => React.ReactElement, boolean][] = [
  ['Box', 'box', (p) => <Box {...p} />, true],
  ['Label', 'label', (p) => <Label {...p}>text</Label>, true],
  ['Frame', 'frame', (p) => <Frame {...p} />, true],
  ['Emphasis', 'emphasis', (p) => <Emphasis {...p} />, true],
  ['SymbolChip', 'chip', (p) => <SymbolChip {...p} />, true],
  ['Arrow', 'arrow', (p) => <Arrow from={[0, 0]} to={[10, 10]} {...p} />, false],
  ['Appear', 'appear', (p) => <Appear {...p}>x</Appear>, false],
  ['SceneLayer', 'scene-layer', (p) => <SceneLayer {...p}>x</SceneLayer>, false],
]

describe.each(matrix)('%s (M-11)', (_name, hook, make, placeable) => {
  it('exposes its own stable hook and forwards className, style and data attributes', () => {
    const { container } = render(make(sentinel))
    const el = container.querySelector(`[data-presentation-${hook}]`) as HTMLElement | SVGElement
    expect(el).not.toBeNull()
    expect(el.getAttribute('class')).toContain('sentinel-class')
    expect(el.getAttribute('data-sentinel')).toBe('yes')
    expect((el as HTMLElement).style.outlineWidth).toBe('5px')
  })

  it.runIf(placeable)('forwards its identity and literal placement', () => {
    const { container } = render(make({ id: 'ent-1', x: 11, y: 22, w: 33, h: 44 }))
    const el = container.querySelector(`[data-presentation-${hook}]`) as HTMLElement
    expect(el.getAttribute('data-presentation-entity')).toBe('ent-1')
    expect([el.style.position, el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['absolute', '11px', '22px', '33px', '44px'])
  })
})

describe('Arrow identity and geometry', () => {
  it('carries its entity id and draws an end head by default, both on request, none on request', () => {
    const heads = (head?: 'end' | 'both' | 'none') => {
      const { container } = render(<Arrow id="a-1" from={[1, 2]} to={[30, 40]} head={head} />)
      const path = container.querySelector('[data-presentation-arrow-path]')!
      expect(container.querySelector('[data-presentation-arrow]')!.getAttribute('data-presentation-entity')).toBe('a-1')
      expect(path.getAttribute('d')).toBe('M 1 2 L 30 40')
      return [path.hasAttribute('marker-start'), path.hasAttribute('marker-end')]
    }
    expect(heads()).toEqual([false, true])
    expect(heads('both')).toEqual([true, true])
    expect(heads('none')).toEqual([false, false])
  })

  it('bends a path with a quadratic curve', () => {
    expect(arrowPath([0, 0], [100, 0], 20)).toBe('M 0 0 Q 50 20 100 0')
    expect(arrowPath([0, 0], [100, 0])).toBe('M 0 0 L 100 0')
  })
})

describe('optional glyphs use the icon-as-component pattern (C-04)', () => {
  it('renders a glyph component with a hook, and also renders without one', () => {
    const { container } = render(
      <>
        <Box id="with" icon={Heart} label="loved" />
        <Box id="without" label="plain" />
        <SymbolChip id="chip" icon={Heart} symbol="♥" label="like" />
      </>,
    )
    const withGlyph = container.querySelector('[data-presentation-entity="with"]')!
    expect(withGlyph.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
    expect(withGlyph.textContent).toBe('loved')
    const without = container.querySelector('[data-presentation-entity="without"]')!
    expect(without.querySelector('svg')).toBeNull()
    expect(without.textContent).toBe('plain')
    expect(container.querySelector('[data-presentation-entity="chip"] svg[data-presentation-glyph]')).not.toBeNull()
  })
})

describe('primitives apply no visual style of their own (M-10)', () => {
  it.each(matrix.filter((m) => m[3]))('%s renders without author CSS and carries only placement geometry', (_n, hook, make) => {
    const { container } = render(make({ id: 'z' }))
    const el = container.querySelector(`[data-presentation-${hook}]`) as HTMLElement
    expect(el.getAttribute('style') ?? '').toBe('')
    expect(el.getAttribute('class')).toBeNull()
  })
})
