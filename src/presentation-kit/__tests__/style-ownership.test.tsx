import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Box } from '../nodes/Box'
import { Label } from '../nodes/Label'
import { Frame } from '../nodes/Frame'
import { Emphasis } from '../nodes/Emphasis'
import { SymbolChip } from '../nodes/SymbolChip'

describe('style ownership boundary', () => {
  it('renders primitives with stable data hooks and no default visual styling', () => {
    render(
      <div>
        <Box layoutId="box-1">box</Box>
        <Label layoutId="label-1">label</Label>
        <Frame layoutId="frame-1">frame</Frame>
        <Emphasis layoutId="emphasis-1">emphasis</Emphasis>
        <SymbolChip layoutId="chip-1">chip</SymbolChip>
      </div>,
    )

    const box = screen.getByText('box')
    const label = screen.getByText('label')
    const frame = screen.getByText('frame')
    const emphasis = screen.getByText('emphasis')
    const chip = screen.getByText('chip')

    for (const node of [box, label, frame, emphasis, chip]) {
      // No presentation-owned CSS was loaded, so the kit must not have
      // supplied any fallback color, border, shadow, or background itself.
      expect(node).not.toHaveAttribute('class')
      expect(node.getAttribute('style')).toBeNull()
    }

    expect(box).toHaveAttribute('data-presentation-node', 'box')
    expect(label).toHaveAttribute('data-presentation-node', 'label')
    expect(frame).toHaveAttribute('data-presentation-node', 'frame')
    expect(emphasis).toHaveAttribute('data-presentation-node', 'emphasis')
    expect(chip).toHaveAttribute('data-presentation-node', 'symbol-chip')
  })

  it('lets a presentation apply its own className to a primitive', () => {
    render(
      <Box layoutId="styled-box" className="my-presentation-box">
        styled
      </Box>,
    )

    expect(screen.getByText('styled')).toHaveClass('my-presentation-box')
  })
})
