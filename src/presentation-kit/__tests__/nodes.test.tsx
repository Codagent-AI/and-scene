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
