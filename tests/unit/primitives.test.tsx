// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Bot } from 'lucide-react'
import { motion } from 'motion/react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'

const geometry = { x: 12, y: 34, w: 56, h: 78 }

describe('kit primitives expose stable hooks and forward author props', () => {
  it('Box carries its identity hook, geometry, and forwards className and data attributes', () => {
    const { container } = render(
      <Box id="card" geometry={geometry} className="author-card" data-author="yes" style={{ zIndex: 2 }}>
        text
      </Box>,
    )
    const node = container.querySelector('[data-presentation-node="box"]') as HTMLElement
    expect(node.getAttribute('data-presentation-id')).toBe('card')
    expect(node.className).toBe('author-card')
    expect(node.getAttribute('data-author')).toBe('yes')
    expect(node.style.left).toBe('12px')
    expect(node.style.top).toBe('34px')
    expect(node.style.width).toBe('56px')
    expect(node.style.zIndex).toBe('2')
  })

  it('an author data attribute does not suppress the stable hook', () => {
    const { container } = render(<Box id="card" data-presentation-node="override" />)
    expect(container.querySelector('[data-presentation-node="box"]')).not.toBeNull()
  })

  it('renders a provided Lucide glyph only when supplied', () => {
    const withIcon = render(<Box id="a" icon={Bot} />)
    expect(withIcon.container.querySelector('svg')).not.toBeNull()
    withIcon.unmount()
    const withoutIcon = render(<Box id="b" />)
    expect(withoutIcon.container.querySelector('svg')).toBeNull()
  })

  it('Label, Frame, Emphasis, and SymbolChip each carry their node hook and geometry', () => {
    const { container } = render(
      <SceneLayer>
        <Label id="l" geometry={geometry} className="x">label</Label>
        <Frame id="f" geometry={geometry} className="x">frame</Frame>
        <Emphasis id="e" geometry={geometry} className="x" />
        <SymbolChip id="c" geometry={geometry} icon={Bot} className="x">chip</SymbolChip>
      </SceneLayer>,
    )
    for (const kind of ['label', 'frame', 'emphasis', 'symbol-chip']) {
      const node = container.querySelector(`[data-presentation-node="${kind}"]`) as HTMLElement
      expect(node, kind).not.toBeNull()
      expect(node.className).toBe('x')
      expect(node.style.height).toBe('78px')
    }
    expect(container.querySelector('[data-presentation-node="symbol-chip"] svg')).not.toBeNull()
  })

  it('Arrow sets its geometry and marks two-way arrows', () => {
    const { container } = render(<Arrow id="a" x={10} y={20} length={100} angle={30} twoWay />)
    const node = container.querySelector('[data-presentation-node="arrow"]') as HTMLElement
    expect(node.style.left).toBe('10px')
    expect(node.style.width).toBe('100px')
    expect(node.getAttribute('data-presentation-two-way')).toBe('true')
    const oneWay = render(<Arrow id="b" x={0} y={0} length={5} />)
    expect(oneWay.container.querySelector('[data-presentation-two-way]')).toBeNull()
  })

  it('SceneLayer absolutely positions its layer and does not reflow sibling layers', () => {
    const { container } = render(
      <>
        <SceneLayer><Box id="one" geometry={geometry} /></SceneLayer>
        <SceneLayer><Box id="two" geometry={geometry} /></SceneLayer>
      </>,
    )
    const layers = container.querySelectorAll('[data-presentation-layer]')
    expect(layers).toHaveLength(2)
    for (const layer of layers) expect((layer as HTMLElement).style.position).toBe('absolute')
  })

  it('a raw motion element with a stable layoutId and author coordinates renders in a layer', () => {
    const { container } = render(
      <SceneLayer>
        <motion.div layoutId="coords" className="raw" data-presentation-id="coords" style={{ position: 'absolute', left: 300, top: 40 }} />
      </SceneLayer>,
    )
    const node = container.querySelector('[data-presentation-id="coords"]') as HTMLElement
    expect(node.tagName).toBe('DIV')
    expect(node.style.left).toBe('300px')
    expect(node.className).toBe('raw')
  })
})
