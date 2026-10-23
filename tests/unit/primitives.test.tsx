import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { describe, expect, it } from 'vitest'
import { ALLOW_OVERLAP, Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, arrowPath } from '../../src/presentation-kit'

describe('node primitives', () => {
  it.each([
    ['box', Box],
    ['label', Label],
    ['frame', Frame],
    ['emphasis', Emphasis],
    ['chip', SymbolChip],
  ])('%s exposes identity, kind and class/style hooks', (kind, Node) => {
    const { container } = render(
      <SceneLayer>
        <Node id="x/one" x={10} y={20} width={30} height={40} className="mine" style={{ color: 'red' }} dataAttrs={{ 'data-extra': 'yes' }} />
      </SceneLayer>,
    )
    const el = container.querySelector('[data-presentation-entity="x/one"]') as HTMLElement
    expect(el.getAttribute('data-presentation-kind')).toBe(kind)
    expect(el).toHaveClass('mine')
    expect(el.getAttribute('data-extra')).toBe('yes')
    expect(el.style.color).toBe('red')
    expect([el.style.position, el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['absolute', '10px', '20px', '30px', '40px'])
  })

  it('renders an optional glyph and lets authors mark an allowed overlap', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="g" x={0} y={0} Icon={Check} dataAttrs={ALLOW_OVERLAP}>
          hi
        </Box>
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-allow-overlap]')).not.toBeNull()
  })

  it('draws arrows from geometry with optional curve and heads', () => {
    expect(arrowPath({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe('M 0 0 Q 50 0 100 0')
    expect(arrowPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 20)).toBe('M 0 0 Q 50 20 100 0')
    const { container } = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 50, y: 50 }} bidirectional />)
    const svg = container.querySelector('[data-presentation-entity="a"]')
    expect(svg?.getAttribute('data-presentation-kind')).toBe('arrow')
    expect(svg?.querySelector('path[marker-start]')).not.toBeNull()
  })

  it('supports raw motion elements with stable layoutIds next to primitives, and stacked entities', () => {
    const { container } = render(
      <SceneLayer>
        <motion.div key="raw" layoutId="raw" data-presentation-entity="raw" style={{ position: 'absolute', left: 5, top: 5 }} />
        <Box key="b1" id="b1" x={0} y={0} width={50} height={50} />
        <Box key="b2" id="b2" x={0} y={0} width={50} height={50} />
        <Appear key="ap">late</Appear>
      </SceneLayer>,
    )
    // Stacked entities keep their authored coordinates: nothing is auto-spread.
    expect(container.querySelector('[data-presentation-entity="b1"]')).toHaveStyle({ left: '0px', top: '0px' })
    expect(container.querySelector('[data-presentation-entity="b2"]')).toHaveStyle({ left: '0px', top: '0px' })
    expect(container.querySelector('[data-presentation-entity="raw"]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-appear]')).toHaveStyle({ opacity: '0' })
  })
})
