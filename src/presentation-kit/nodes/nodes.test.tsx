import { render } from '@testing-library/react'
import { Plug } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '..'

describe('node primitives', () => {
  it('expose identity, class, style and placement hooks without visual defaults', () => {
    const { container } = render(
      <SceneLayer name="l">
        <Box id="a" className="mine" style={{ color: 'red' }} x={10} y={20} w={30} h={40} Icon={Plug}>
          hi
        </Box>
        <Label id="b" x={1} y={2}>t</Label>
        <SymbolChip id="c" Icon={Plug}>c</SymbolChip>
        <Frame id="d" w={5} h={5} />
        <Emphasis id="e" w={5} h={5} />
        <Arrow id="f" from={[0, 0]} to={[50, 0]} twoWay />
        <Appear><span /></Appear>
      </SceneLayer>,
    )
    const box = container.querySelector('[data-presentation-id="a"]') as HTMLElement
    expect(box.getAttribute('data-presentation-node')).toBe('box')
    expect(box.classList.contains('mine')).toBe(true)
    expect(box.style.left).toBe('10px')
    expect(box.style.width).toBe('30px')
    expect(box.style.color).toBe('red')
    expect(box.querySelector('[data-presentation-glyph]')).toBeTruthy()
    for (const kind of ['label', 'chip', 'frame', 'emphasis', 'arrow']) {
      expect(container.querySelector(`[data-presentation-node="${kind}"]`), kind).toBeTruthy()
    }
    // Unstyled output: only geometry in inline styles.
    const label = container.querySelector('[data-presentation-id="b"]') as HTMLElement
    expect(label.getAttribute('style')).not.toMatch(/color|background|font|border|shadow/)
  })
})
