import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LayoutGroup } from 'motion/react'
import { User } from 'lucide-react'
import {
  Appear, Arrow, Box, ENTER_DELAY, Emphasis, Frame, LAYOUT_T, Label, SceneLayer, SymbolChip,
} from '../../src/presentation-kit'
import { appearProps } from '../../src/presentation-kit/nodes/shared'
import { arrowPath } from '../../src/presentation-kit/nodes/arrowPath'

const q = (sel: string) => document.querySelector(sel) as HTMLElement

describe('node primitives', () => {
  it('expose kind, stable id and variant hooks plus class and style passthrough (I-10, I-13)', () => {
    render(
      <LayoutGroup>
        <Box layoutId="b" className="mine" style={{ zIndex: 3 }} variant="card" at={{ x: 1, y: 2, w: 30, h: 40 }} data-extra="1">hi</Box>
        <Label layoutId="l" className="lab">text</Label>
        <Frame layoutId="f" className="fr" />
        <Emphasis layoutId="e" className="em" />
        <SymbolChip layoutId="c" className="chip" Icon={User}>chip</SymbolChip>
        <Arrow layoutId="a" from={{ x: 0, y: 0 }} to={{ x: 10, y: 10 }} className="ar" variant="modify" />
      </LayoutGroup>,
    )
    const kinds = ['box', 'label', 'frame', 'emphasis', 'chip', 'arrow']
    const ids = ['b', 'l', 'f', 'e', 'c', 'a']
    kinds.forEach((kind, i) => {
      const el = q(`[data-presentation-node="${kind}"]`)
      expect(el, kind).not.toBeNull()
      expect(el.getAttribute('data-presentation-id')).toBe(ids[i])
    })
    const box = q('[data-presentation-node="box"]')
    expect(box.className).toContain('mine')
    expect(box.getAttribute('data-presentation-variant')).toBe('card')
    expect(box.getAttribute('data-extra')).toBe('1')
    expect(box.style.zIndex).toBe('3')
    expect([box.style.position, box.style.left, box.style.top, box.style.width, box.style.height])
      .toEqual(['absolute', '1px', '2px', '30px', '40px'])
    expect(q('[data-presentation-node="chip"] [data-presentation-glyph]')).not.toBeNull()
    expect(q('[data-presentation-node="arrow"]').getAttribute('data-presentation-variant')).toBe('modify')
    expect(q('[data-presentation-node="arrow"]').getAttribute('class')).toBe('ar')
  })

  it('adds no visual styling of its own (I-11)', () => {
    render(<Box layoutId="b">x</Box>)
    const style = q('[data-presentation-node="box"]').getAttribute('style') ?? ''
    expect(style).not.toMatch(/color|background|border|shadow|font/i)
  })

  it('newcomers wait for persisting entities to settle before entering (I-5)', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const props = appearProps(true)
    expect(props.initial).toEqual({ opacity: 0 })
    expect(props.animate?.transition.delay).toBe(ENTER_DELAY)
    expect(appearProps(false)).toEqual({})
    render(<Box layoutId="n" appear>new</Box>)
    expect(q('[data-presentation-node="box"]').style.opacity).toBe('0')
    render(<Appear>wrapped</Appear>)
    expect(q('[data-presentation-node="appear"]').style.opacity).toBe('0')
  })

  it('does not hide entities that are not newcomers', () => {
    render(<Box layoutId="n">old</Box>)
    expect(q('[data-presentation-node="box"]').style.opacity).not.toBe('0')
  })

  it('draws straight or bent arrow paths', () => {
    expect(arrowPath({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe('M 0 0 L 10 0')
    expect(arrowPath({ x: 0, y: 0 }, { x: 10, y: 0 }, 4)).toBe('M 0 0 Q 5 4 10 0')
  })

  it('SceneLayer fills the canvas absolutely and keyed children exit when removed (I-6, I-9)', async () => {
    const { rerender } = render(
      <SceneLayer>
        <Box key="a" layoutId="a">a</Box>
        <Box key="b" layoutId="b">b</Box>
      </SceneLayer>,
    )
    const layer = q('[data-presentation-layer]')
    expect([layer.style.position, layer.style.inset]).toEqual(['absolute', '0px'])
    rerender(
      <SceneLayer>
        <Box key="a" layoutId="a">a</Box>
      </SceneLayer>,
    )
    await waitFor(() => expect(document.querySelector('[data-presentation-id="b"]')).toBeNull())
    expect(document.querySelector('[data-presentation-id="a"]')).not.toBeNull()
  })
})
