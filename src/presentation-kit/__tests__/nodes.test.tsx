// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Bot } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../index'
import { arrowPath } from '../nodes/arrowPath'

describe('node primitives', () => {
  it('forward the stable hook, class, literal coordinates, and custom data hooks', () => {
    const view = render(
      <>
        <Box layoutId="box-1" className="custom-box" style={{ left: 12, top: 34, width: 56, height: 78 }} data-presentation-id="box-1" data-custom="yes">
          boxed
        </Box>
        <Label className="custom-label" style={{ left: 1, top: 2 }} data-custom="label">
          labeled
        </Label>
        <Frame className="custom-frame" style={{ left: 3, top: 4 }} data-custom="frame">
          framed
        </Frame>
        <Emphasis className="custom-emphasis" style={{ left: 5, top: 6 }} data-custom="emphasis">
          emphasized
        </Emphasis>
        <SymbolChip symbol="visual" Icon={Bot} className="custom-chip" style={{ left: 7, top: 8 }} data-custom="chip">
          chip
        </SymbolChip>
        <Appear className="custom-appear" data-custom="appear">
          <span>entering</span>
        </Appear>
        <SceneLayer name="layer-a">
          <Label>layered</Label>
        </SceneLayer>
      </>,
    )
    const box = view.container.querySelector<HTMLElement>('[data-presentation-box]')!
    expect(box.className).toContain('custom-box')
    expect(box.style.left).toBe('12px')
    expect(box.style.top).toBe('34px')
    expect(box.style.width).toBe('56px')
    expect(box.style.height).toBe('78px')
    expect(box.style.position).toBe('absolute')
    expect(box.getAttribute('data-custom')).toBe('yes')
    expect(box.getAttribute('data-presentation-id')).toBe('box-1')
    expect(view.container.querySelector('[data-presentation-label].custom-label')!.getAttribute('data-custom')).toBe('label')
    expect(view.container.querySelector('[data-presentation-frame].custom-frame')!.getAttribute('data-custom')).toBe('frame')
    expect(view.container.querySelector('[data-presentation-emphasis].custom-emphasis')!.getAttribute('data-custom')).toBe('emphasis')
    const chip = view.container.querySelector<HTMLElement>('[data-presentation-chip]')!
    expect(chip.getAttribute('data-presentation-symbol')).toBe('visual')
    expect(chip.style.left).toBe('7px')
    expect(view.container.querySelector('[data-presentation-appear].custom-appear')!.getAttribute('data-custom')).toBe('appear')
    expect(view.container.querySelector('[data-presentation-layer="layer-a"] [data-presentation-label]')).not.toBeNull()
  })

  it('renders a supplied Lucide glyph inside a box without adding visual defaults', () => {
    const view = render(
      <Box Icon={Bot} style={{ left: 0, top: 0, width: 10, height: 10 }}>
        glyph
      </Box>,
    )
    const icon = view.container.querySelector('[data-presentation-icon]')
    expect(icon).not.toBeNull()
    expect(icon!.tagName.toLowerCase()).toBe('svg')
    const box = view.container.querySelector<HTMLElement>('[data-presentation-box]')!
    expect(box.getAttribute('style')).not.toMatch(/color|background|border|font|shadow/)
  })

  it('renders an arrow in canvas coordinates with its endpoints in the path', () => {
    const view = render(<Arrow from={{ x: 180, y: 84 }} to={{ x: 700, y: 84 }} bidirectional data-presentation-entity="chat" />)
    const svg = view.container.querySelector<SVGElement>('[data-presentation-arrow]')!
    expect(svg.style.left).toBe('172px')
    expect(svg.style.top).toBe('76px')
    expect(svg.getAttribute('viewBox')).toBe('172 76 536 16')
    expect(svg.getAttribute('data-presentation-entity')).toBe('chat')
    const d = svg.querySelector('path')!.getAttribute('d')!
    expect(d.startsWith('M180 84L700 84')).toBe(true)
  })

  it('draws arrowheads at both ends only when bidirectional', () => {
    const one = arrowPath({ x: 0, y: 0 }, { x: 100, y: 0 }, false)
    const two = arrowPath({ x: 0, y: 0 }, { x: 100, y: 0 }, true)
    expect(one.split('M').length - 1).toBe(3)
    expect(two.split('M').length - 1).toBe(5)
  })

  it('holds no fill or stroke declaration on arrow paths', () => {
    const view = render(<Arrow from={{ x: 0, y: 0 }} to={{ x: 50, y: 50 }} />)
    const path = view.container.querySelector('path')!
    expect(path.getAttribute('fill')).toBeNull()
    expect(path.getAttribute('stroke')).toBeNull()
  })
})
