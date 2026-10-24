import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Star } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, ENTER_DELAY, Frame, LAYOUT_T, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'

const entity = (c: HTMLElement, id: string) => c.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement | null

describe('kit primitives expose style hooks', () => {
  it('render a kind hook, entity hook, className and style pass-through', () => {
    const { container } = render(
      <div>
        <Box id="b" className="mine" style={{ opacity: 0.5 }} x={10} y={20} w={30} h={40} Icon={Star}>box</Box>
        <Label id="l">label</Label>
        <Frame id="f" />
        <Emphasis id="e" />
        <SymbolChip id="c" symbol="*" />
        <Arrow id="a" from={[0, 0]} to={[10, 10]} className="arrow-class" bidirectional dashed />
      </div>,
    )
    const kinds: Record<string, string> = { b: 'box', l: 'label', f: 'frame', e: 'emphasis', c: 'chip', a: 'arrow' }
    for (const [id, kind] of Object.entries(kinds)) {
      expect(entity(container, id)?.getAttribute('data-presentation-node')).toBe(kind)
    }
    const box = entity(container, 'b')!
    expect(box.classList.contains('mine')).toBe(true)
    expect(box.style.left).toBe('10px')
    expect(box.style.top).toBe('20px')
    expect(box.style.width).toBe('30px')
    expect(box.style.height).toBe('40px')
    expect(box.style.position).toBe('absolute')
    expect(box.querySelector('[data-presentation-icon]')).not.toBeNull()
    expect(entity(container, 'a')?.getAttribute('class')).toBe('arrow-class')
    expect(entity(container, 'a')?.querySelector('path[fill="none"]')?.getAttribute('d')).toBe('M 0 0 Q 5 5 10 10')
  })

  it('pass arbitrary data hooks and arrow style through to the markup', () => {
    const { container } = render(
      <div>
        <Box id="b" data-presentation-allow-overlap="" data-custom="yes">x</Box>
        <SymbolChip id="c" data-presentation-allow-overlap="" symbol="*" />
        <Arrow id="a" from={[0, 0]} to={[5, 5]} data-presentation-allow-overlap="" style={{ opacity: 0.4 }} />
      </div>,
    )
    expect(entity(container, 'b')?.hasAttribute('data-presentation-allow-overlap')).toBe(true)
    expect(entity(container, 'b')?.getAttribute('data-custom')).toBe('yes')
    expect(entity(container, 'c')?.hasAttribute('data-presentation-allow-overlap')).toBe(true)
    const arrow = entity(container, 'a')!
    expect(arrow.hasAttribute('data-presentation-allow-overlap')).toBe(true)
    expect(arrow.style.opacity).toBe('0.4')
    expect(arrow.style.position).toBe('absolute')
  })

  it('supply no visual defaults beyond geometry', () => {
    const { container } = render(
      <div>
        <Box id="b">x</Box>
        <Label id="l">x</Label>
        <Frame id="f" />
        <Emphasis id="e" />
        <SymbolChip id="c" symbol="*" />
      </div>,
    )
    for (const id of ['b', 'l', 'f', 'e', 'c']) {
      const style = entity(container, id)!.getAttribute('style') ?? ''
      expect(style).not.toMatch(/color|font|border|shadow|background|padding|margin/i)
    }
  })

  it('does not fade a persisting primitive in as a newcomer', () => {
    const { container } = render(<Box id="b">x</Box>)
    expect(entity(container, 'b')!.style.opacity).toBe('')
  })
})

describe('Appear', () => {
  it('waits for persisting entities to settle before showing newcomers', async () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const { container } = render(
      <Appear>
        <Box id="n">new</Box>
      </Appear>,
    )
    const wrapper = container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).toBe('0')
    // still hidden while persisting entities would be mid-morph
    await new Promise((r) => setTimeout(r, LAYOUT_T * 1000 * 0.4))
    expect(wrapper.style.opacity).toBe('0')
    await waitFor(() => expect(wrapper.style.opacity).toBe('1'), { timeout: 3000 })
  })
})

describe('SceneLayer', () => {
  it('absolutely positions its content so a layer never reflows another', () => {
    const { container } = render(<SceneLayer />)
    const layer = container.querySelector('[data-presentation-layer]') as HTMLElement
    expect(layer.style.position).toBe('absolute')
    expect(layer.style.inset).toMatch(/^0/)
  })

  it('animates a departing entity out and then removes it', async () => {
    const { container, rerender } = render(
      <SceneLayer>
        <Box key="a" id="a">a</Box>
        <Box key="b" id="b">b</Box>
      </SceneLayer>,
    )
    rerender(
      <SceneLayer>
        <Box key="a" id="a">a</Box>
      </SceneLayer>,
    )
    expect(entity(container, 'b')).not.toBeNull()
    await waitFor(() => expect(entity(container, 'b')).toBeNull(), { timeout: 3000 })
    expect(entity(container, 'a')).not.toBeNull()
  })

  it('preserves intentional overlap by keeping each entity at its given coordinates', () => {
    const { container } = render(
      <SceneLayer>
        <Box key="a" id="a" x={10} y={10} w={100} h={100}>a</Box>
        <Box key="b" id="b" x={50} y={50} w={100} h={100}>b</Box>
      </SceneLayer>,
    )
    expect(entity(container, 'a')!.style.left).toBe('10px')
    expect(entity(container, 'b')!.style.left).toBe('50px')
    expect(entity(container, 'b')!.style.top).toBe('50px')
  })
})
