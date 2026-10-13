import { render } from '@testing-library/react'
import { Circle } from 'lucide-react'
import { expect, it } from 'vitest'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { ALLOW_OVERLAP_ATTRIBUTE } from '../src/presentation-kit/types'

it('forwards author hooks and geometry on every identity primitive without adding visual defaults', () => {
  for (const Component of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
    const { container, unmount } = render(<Component layoutId="author:entity" className="author" data-author="custom" style={{ left: 17, top: 20 }} aria-label="Entity">Text</Component>)
    const node = container.firstElementChild as HTMLElement
    expect(node).toHaveAttribute('data-presentation-node')
    expect(node).toHaveAttribute('data-author', 'custom')
    expect(node).toHaveClass('author')
    expect(node).toHaveStyle({ left: '17px', top: '20px' })
    expect(node.style.color).toBe('')
    expect(node.style.border).toBe('')
    expect(node.style.fontFamily).toBe('')
    unmount()
  }
})
it('supports optional Lucide glyphs and explicit overlap subtrees', () => {
  const { container } = render(<Box layoutId="icon" Icon={Circle} data-presentation-allow-overlap>Icon</Box>)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(container.firstElementChild).toHaveAttribute(ALLOW_OVERLAP_ATTRIBUTE)
})
it('keeps layers absolute and exposes newcomer hooks', () => {
  const { container } = render(<SceneLayer data-author="layer"><Appear data-author="new">Newcomer</Appear></SceneLayer>)
  expect(container.querySelector('[data-presentation-node="scene-layer"]')).toHaveStyle({ position: 'absolute', inset: '0' })
  expect(container.querySelector('[data-presentation-node="appear"]')).toHaveAttribute('data-author', 'new')
})
