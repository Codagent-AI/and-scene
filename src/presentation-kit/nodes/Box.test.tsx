import { render, screen } from '@testing-library/react'
import { Box } from './Box'

test('offers identity and styling hooks without visual defaults', () => {
  render(<Box layoutId="demo:box" className="local-card">A box</Box>)

  const box = screen.getByText('A box')
  expect(box.getAttribute('data-presentation-node')).toBe('box')
  expect(box.className).toContain('local-card')
  expect(box.style.color).toBe('')
  expect(box.style.border).toBe('')
})
