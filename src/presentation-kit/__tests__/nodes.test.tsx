import { render } from '@testing-library/react'
import { Compass } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../nodes'

describe('node primitives', () => {
  it('render identity and hooks with no visual styles or classes', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="b" x={10} y={20} w={100} h={50} Icon={Compass} data-extra="1" className="mine">box</Box>
        <Label id="l">label</Label>
        <Frame id="f" />
        <SymbolChip id="s">σ</SymbolChip>
        <Emphasis id="e">em</Emphasis>
        <Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 50, y: 50 }} />
      </SceneLayer>,
    )
    const box = container.querySelector<HTMLElement>('[data-presentation-id="b"]')!
    expect(box.className).toBe('mine')
    expect(box.dataset.extra).toBe('1')
    expect(box.querySelector('[data-presentation-icon]')).not.toBeNull()
    expect(box.style.left).toBe('10px')
    for (const el of container.querySelectorAll<HTMLElement>('[data-presentation-node]')) {
      const s = el.style
      for (const p of ['color', 'backgroundColor', 'border', 'boxShadow', 'fontFamily', 'padding', 'borderRadius']) {
        expect(s.getPropertyValue(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()))).toBe('')
      }
      if (el.dataset.presentationNode !== 'arrow') expect(el.className === '' || el.className === 'mine').toBe(true)
    }
    expect(container.querySelector('[data-presentation-emphasis="on"]')).not.toBeNull()
  })

  it('Appear marks newcomers; continuing entities are plain layout nodes', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="stays">stays</Box>
        <Appear key="new">
          <Box id="new">new</Box>
        </Appear>
      </SceneLayer>,
    )
    const stays = container.querySelector('[data-presentation-id="stays"]')!
    expect(stays.closest('[data-presentation-appear]')).toBeNull()
    expect(container.querySelector('[data-presentation-id="new"]')!.closest('[data-presentation-appear]')).not.toBeNull()
  })
})
