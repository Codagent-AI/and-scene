import { Bot } from 'lucide-react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, appearMotion, arrowPath } from '../../src/presentation-kit'
import { ENTER_DELAY, LAYOUT_T } from '../../src/presentation-kit/constants'

describe('node primitives expose style hooks', () => {
  it('passes identity, className and style through for every primitive', () => {
    const { container } = render(
      <SceneLayer className="layer">
        <Box id="a" Icon={Bot} label="lbl" x={10} y={20} w={30} h={40} className="c1" style={{ opacity: 0.5 }} />
        <Label id="b" className="c2">text</Label>
        <SymbolChip id="c" className="c3">chip</SymbolChip>
        <Frame id="d" label="frame" className="c4" />
        <Emphasis id="e" className="c5" x={1} y={2} w={3} h={4} />
        <Arrow id="f" from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} className="c6" />
      </SceneLayer>,
    )
    const kinds = ['box', 'label', 'chip', 'frame', 'emphasis', 'arrow']
    kinds.forEach((kind, i) => {
      const el = container.querySelector(`[data-presentation-node="${kind}"]`) as HTMLElement
      expect(el, kind).not.toBeNull()
      expect(el.getAttribute('data-presentation-id')).toBe('abcdef'[i])
      expect(el.classList.contains(`c${i + 1}`)).toBe(true)
    })
    const box = container.querySelector('[data-presentation-node="box"]') as HTMLElement
    expect(box.style.left).toBe('10px')
    expect(box.style.width).toBe('30px')
    expect(box.style.opacity).toBe('0.5')
    expect(box.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-layer]')).toHaveClass('layer')
  })

  it('supplies no visual defaults in markup', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="a" label="x" />
        <Label id="b">y</Label>
      </SceneLayer>,
    )
    for (const el of container.querySelectorAll<HTMLElement>('*')) {
      const s = el.style
      for (const prop of ['color', 'background', 'backgroundColor', 'border', 'fontFamily', 'boxShadow', 'padding']) {
        expect(s.getPropertyValue(prop) || (s as unknown as Record<string, string>)[prop], prop).toBeFalsy()
      }
    }
  })
})

describe('Arrow geometry', () => {
  it('draws straight lines and bent arcs', () => {
    expect(arrowPath({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe('M 0 0 L 10 0')
    expect(arrowPath({ x: 0, y: 0 }, { x: 10, y: 0 }, 4)).toBe('M 0 0 Q 5 4 10 0')
  })

  it('adds a start head only for two-way arrows', () => {
    const one = render(<Arrow id="x" from={{ x: 0, y: 0 }} to={{ x: 1, y: 1 }} />)
    expect(one.container.querySelector('path[marker-start]')).toBeNull()
    const both = render(<Arrow id="y" both from={{ x: 0, y: 0 }} to={{ x: 1, y: 1 }} />)
    expect(both.container.querySelector('path[marker-start]')).not.toBeNull()
  })
})

describe('Appear', () => {
  it('delays newcomers until persisting entities have moved', () => {
    expect(appearMotion.initial.opacity).toBe(0)
    expect(appearMotion.animate.transition.delay).toBe(ENTER_DELAY)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(appearMotion.exit.opacity).toBe(0)
  })

  it('renders its children with a hook', () => {
    const { container } = render(<Appear><span>hi</span></Appear>)
    expect(container.querySelector('[data-presentation-appear] span')).toHaveTextContent('hi')
  })
})
