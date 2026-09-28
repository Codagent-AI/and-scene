import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Box } from '../nodes/Box'
import { Label } from '../nodes/Label'
import { SymbolChip } from '../nodes/SymbolChip'

const VISUAL_STYLE_PATTERN = /color|background|border|box-shadow|font/i

describe('style ownership boundary', () => {
  it('primitives expose stable data hooks and add no visual defaults', () => {
    const { container } = render(
      <div>
        <Box layoutId="box-1" className="my-box">
          content
        </Box>
        <Label className="my-label">label</Label>
        <SymbolChip layoutId="chip-1" label="chip" className="my-chip" />
      </div>,
    )

    const box = container.querySelector('[data-presentation-box]')
    expect(box).toHaveClass('my-box')
    expect(box?.getAttribute('style') ?? '').not.toMatch(VISUAL_STYLE_PATTERN)

    const label = container.querySelector('[data-presentation-label]')
    expect(label).toHaveClass('my-label')
    expect(label?.getAttribute('style') ?? '').not.toMatch(VISUAL_STYLE_PATTERN)

    const chip = container.querySelector('[data-presentation-symbol-chip]')
    expect(chip).toHaveClass('my-chip')
    expect(chip?.querySelector('[data-presentation-symbol-chip-label]')).toHaveTextContent('chip')
    expect(chip?.getAttribute('style') ?? '').not.toMatch(VISUAL_STYLE_PATTERN)
  })

  it('renders unstyled without any fallback palette, border, or shadow', () => {
    const { container } = render(<Box layoutId="box-2">plain</Box>)
    const box = container.querySelector('[data-presentation-box]')
    expect(box?.className).toBe('')
    expect(box?.getAttribute('style') ?? '').not.toMatch(VISUAL_STYLE_PATTERN)
  })
})
