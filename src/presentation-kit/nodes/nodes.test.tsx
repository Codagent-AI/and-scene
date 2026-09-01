import { render, screen } from '@testing-library/react'
import { Box } from './Box'

describe('Box', () => {
  it('provides identity and style hooks without kit-owned visual styles', () => {
    render(<Box layoutId="sample:box" className="presentation-box">Content</Box>)

    const box = screen.getByText('Content')
    expect(box).toHaveAttribute('data-presentation-box', 'true')
    expect(box).toHaveClass('presentation-box')
    expect(box).not.toHaveAttribute('style')
  })
})
