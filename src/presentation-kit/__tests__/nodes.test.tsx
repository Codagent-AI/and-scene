import { render, waitFor } from '@testing-library/react'
import { Rocket } from 'lucide-react'
import { motion } from 'motion/react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../index.ts'

const GEOMETRY = new Set(['position', 'left', 'top', 'width', 'height', 'inset', 'pointer-events', 'overflow'])

function visualStyles(el: Element): string[] {
  const style = (el as HTMLElement).style
  return [...Array(style.length).keys()].map((i) => style[i]).filter((p) => !GEOMETRY.has(p) && !p.startsWith('transform') && p !== 'opacity')
}

describe('generic primitives', () => {
  it('expose stable identity, hooks and class/style pass-through', () => {
    const { container } = render(
      <SceneLayer className="layer">
        <Box id="a" className="mine" style={{ left: 10, top: 20 }}>
          text
        </Box>
        <Label id="b">label</Label>
        <Frame id="c" />
        <SymbolChip id="d" icon={Rocket} />
        <Emphasis id="e" />
        <Arrow id="f" from={{ x: 0, y: 0 }} to={{ x: 10, y: 10 }} className="line" />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-layer].layer')).not.toBeNull()
    const box = container.querySelector<HTMLElement>('[data-presentation-id="a"]')!
    expect(box.getAttribute('data-presentation-node')).toBe('box')
    expect(box.classList.contains('mine')).toBe(true)
    expect(box.style.left).toBe('10px')
    for (const [id, kind] of [['b', 'label'], ['c', 'frame'], ['d', 'chip'], ['f', 'arrow']]) {
      expect(container.querySelector(`[data-presentation-id="${id}"]`)?.getAttribute('data-presentation-node')).toBe(kind)
    }
    expect(container.querySelector('[data-presentation-id="e"]')).not.toBeNull()
  })

  it('passes className and style through on every primitive', () => {
    const { container } = render(
      <SceneLayer className="c-layer" style={{ left: 1 }}>
        <Box id="b" className="c-b" style={{ left: 2 }} />
        <Label id="l" className="c-l" style={{ left: 3 }} />
        <Frame id="f" className="c-f" style={{ left: 4 }} />
        <SymbolChip id="s" className="c-s" style={{ left: 5 }} />
        <Emphasis id="e" className="c-e" style={{ left: 6 }} />
        <Appear id="a" className="c-a" style={{ left: 7 }} />
        <Arrow id="r" className="c-r" from={{ x: 0, y: 0 }} to={{ x: 1, y: 1 }} />
      </SceneLayer>,
    )
    const left = (cls: string) => container.querySelector<HTMLElement>(`.${cls}`)?.style.left
    expect([left('c-layer'), left('c-b'), left('c-l'), left('c-f'), left('c-s'), left('c-e'), left('c-a')]).toEqual([
      '1px', '2px', '3px', '4px', '5px', '6px', '7px',
    ])
    expect(container.querySelector('svg.c-r')).not.toBeNull()
  })

  it('renders an optional Lucide icon component', () => {
    const { container } = render(
      <>
        <Box id="with" icon={Rocket} />
        <Box id="without" />
      </>,
    )
    expect(container.querySelector('[data-presentation-id="with"] [data-presentation-icon]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-id="without"] [data-presentation-icon]')).toBeNull()
  })

  it('supply no visual defaults of their own', () => {
    const { container } = render(
      <>
        <Box id="a">x</Box>
        <Label id="b">y</Label>
        <Frame id="c" />
        <SceneLayer />
        <Arrow id="f" from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} />
      </>,
    )
    for (const el of container.querySelectorAll('[data-presentation-node], [data-presentation-layer]')) {
      expect(visualStyles(el)).toEqual([])
    }
  })

  it('supports raw motion elements with stable layoutIds', () => {
    const { container } = render(<motion.div layoutId="raw" data-testid="raw" style={{ left: 3 }} />)
    expect(container.querySelector('[data-testid="raw"]')).not.toBeNull()
  })
})

describe('Appear', () => {
  it('mounts newcomers and animates departing entities out before removing them', async () => {
    const { container, rerender } = render(<Appear when={false}>hello</Appear>)
    expect(container.textContent).toBe('')
    rerender(<Appear when>hello</Appear>)
    expect(container.textContent).toBe('hello')
    rerender(<Appear when={false}>hello</Appear>)
    await waitFor(() => expect(container.textContent).toBe(''), { timeout: 3000 })
  })
})
