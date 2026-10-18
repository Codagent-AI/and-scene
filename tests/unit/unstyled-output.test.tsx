import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip } from '../../src/presentation-kit'
import { makeDeck } from '../support/deck'

// Properties the kit may set inline: canvas geometry, scale, and Motion's own projection output.
const GEOMETRY = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'min-width', 'min-height', 'max-height',
  'display', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction', 'align-items', 'justify-content', 'list-style', 'list-style-type', 'list-style-position', 'list-style-image', 'overflow', 'overflow-x', 'overflow-y',
  'white-space', 'text-overflow', 'transform', 'transform-origin', 'will-change', 'opacity', 'translate', 'scale',
])

function inlineProperties(root: ParentNode) {
  const used = new Set<string>()
  for (const el of root.querySelectorAll<HTMLElement>('[style]')) {
    for (let i = 0; i < el.style.length; i++) used.add(el.style.item(i))
  }
  return used
}

describe('rendered kit output without presentation CSS', () => {
  it('carries only geometry, never colour, font, border, shadow or spacing', () => {
    const { container } = render(
      <>
        <Presentation steps={makeDeck()} title="Deck" />
        <SceneLayer>
          <Appear key="a"><Box id="a" enter x={1} y={2} width={3} height={4} Icon={Check} label="x" /></Appear>
          <Label key="b" id="b" x={1} y={2}>b</Label>
          <Frame key="c" id="c" x={1} y={2} width={3} height={4} />
          <Emphasis key="d" id="d" x={1} y={2} width={3} height={4} />
          <SymbolChip key="e" id="e" x={1} y={2} symbol="?" />
          <Arrow key="f" id="f" from={[0, 0]} to={[10, 10]} bidirectional />
        </SceneLayer>
      </>,
    )
    const used = [...inlineProperties(container)]
    expect(used.length).toBeGreaterThan(5)
    expect(used.filter((p) => !GEOMETRY.has(p))).toEqual([])
    expect(container.querySelectorAll('[class]:not(svg)')).toHaveLength(0)
    expect(container.querySelector('style, link[rel=stylesheet]')).toBeNull()
  })
})
