import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Box } from './Box'

describe('Box style ownership boundary', () => {
  it('renders no fallback color, font, border, or shadow styling', () => {
    const { container } = render(<Box layoutId="node-a">content</Box>)
    const node = container.querySelector('[data-presentation-node="box"]') as HTMLElement

    expect(node).not.toBeNull()
    expect(node.className).toBe('')
    expect(node.style.color).toBe('')
    expect(node.style.backgroundColor).toBe('')
    expect(node.style.border).toBe('')
    expect(node.style.boxShadow).toBe('')
    expect(node.style.fontFamily).toBe('')
  })

  it('applies only presentation-owned class and style props, unmodified', () => {
    const { container } = render(
      <Box layoutId="node-b" className="talk-node" style={{ color: 'red' }}>
        content
      </Box>,
    )
    const node = container.querySelector('.talk-node') as HTMLElement
    expect(node.style.color).toBe('red')
  })
})
