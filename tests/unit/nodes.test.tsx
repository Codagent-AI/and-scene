import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'

const q = (sel: string) => document.querySelector<HTMLElement>(sel)!

describe('primitives', () => {
  it.each([
    ['box', <Box key="1" id="e" className="mine" x={5} y={6} width={7} height={8} label="L" />],
    ['label', <Label key="2" id="e" className="mine" x={5} y={6} width={7} height={8}>L</Label>],
    ['frame', <Frame key="3" id="e" className="mine" x={5} y={6} width={7} height={8} />],
    ['emphasis', <Emphasis key="4" id="e" className="mine" x={5} y={6} width={7} height={8} />],
    ['symbol-chip', <SymbolChip key="5" id="e" className="mine" x={5} y={6} width={7} height={8} symbol="?" />],
  ])('%s exposes identity, kind, class and coordinates', (kind, el) => {
    render(el)
    const node = q(`[data-presentation-node="${kind}"]`)
    expect(node.dataset.presentationEntity).toBe('e')
    expect(node.className).toBe('mine')
    expect(node.style.left).toBe('5px')
    expect(node.style.top).toBe('6px')
    expect(node.style.width).toBe('7px')
    expect(node.style.height).toBe('8px')
    expect(node.style.position).toBe('absolute')
  })

  it('arrow exposes line and head hooks, and a second head when bidirectional', () => {
    const { unmount } = render(<Arrow id="a" from={[0, 0]} to={[100, 0]} className="c" />)
    expect(q('[data-presentation-node="arrow"]').getAttribute('class')).toBe('c')
    expect(document.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(1)
    expect(q('[data-presentation-arrow-line]').getAttribute('d')).toBe('M0,0 Q50,0 100,0')
    unmount()
    render(<Arrow id="a" from={[0, 0]} to={[100, 0]} bidirectional bend={10} />)
    expect(document.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    expect(q('[data-presentation-arrow-line]').getAttribute('d')).not.toBe('M0,0 Q50,0 100,0')
  })

  it('lets author style override kit geometry and adds extra hooks', () => {
    render(<Box id="e" x={5} y={6} style={{ left: 99, transform: 'rotate(3deg)' }} hooks={{ 'data-variant': 'ghost' }} />)
    const node = q('[data-presentation-node="box"]')
    expect(node.style.left).toBe('99px')
    expect(node.style.top).toBe('6px')
    expect(node.dataset.variant).toBe('ghost')
  })

  it('positions nothing when no coordinates are given', () => {
    render(<Box id="e" />)
    expect(q('[data-presentation-node="box"]').style.position).toBe('')
  })

  it('renders a Lucide icon component in the hooked primitive; the glyph is optional', () => {
    const { unmount } = render(<Box id="e" Icon={Check} label="ok" />)
    expect(q('[data-presentation-node="box"] [data-presentation-glyph] svg')).not.toBeNull()
    unmount()
    render(<Box id="e" label="ok" />)
    expect(document.querySelector('[data-presentation-glyph]')).toBeNull()
    render(<SymbolChip id="c" Icon={Check} />)
    expect(q('[data-presentation-node="symbol-chip"] svg')).not.toBeNull()
  })

  it('appear and scene layer expose hooks; the layer positions absolutely', () => {
    render(
      <SceneLayer className="layer">
        <Appear key="a"><i /></Appear>
      </SceneLayer>,
    )
    const layer = q('[data-presentation-scene-layer]')
    expect(layer.className).toBe('layer')
    expect(layer.style.position).toBe('absolute')
    expect(layer.querySelector('[data-presentation-appear]')).not.toBeNull()
  })

  it('passes overlapping geometry through unchanged', () => {
    render(
      <SceneLayer>
        <Box key="a" id="a" x={10} y={10} width={100} height={50} />
        <Box key="b" id="b" x={40} y={30} width={100} height={50} />
      </SceneLayer>,
    )
    expect(q('[data-presentation-entity="a"]').style.left).toBe('10px')
    expect(q('[data-presentation-entity="b"]').style.left).toBe('40px')
    expect(q('[data-presentation-entity="b"]').style.top).toBe('30px')
  })

  it('supports raw motion elements with a stable layoutId inside a layer', async () => {
    const { motion } = await import('motion/react')
    render(
      <SceneLayer>
        <motion.div key="raw" layoutId="raw" data-raw="" style={{ position: 'absolute', left: 3, top: 4 }} />
      </SceneLayer>,
    )
    expect(q('[data-raw]').style.left).toBe('3px')
  })
})
