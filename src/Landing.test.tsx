import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('./presentations', () => ({
  presentations: [
    { slug: 'how-to-make-a-presentation', title: 'How to Make a Presentation', load: async () => ({ default: () => null }) },
  ],
}))

describe('Landing', () => {
  it('enumerates registered presentations with a link to each', async () => {
    const { default: Landing } = await import('./Landing')
    render(<Landing />)
    const link = screen.getByRole('link', { name: 'How to Make a Presentation' })
    expect(link).toHaveAttribute('href', '/how-to-make-a-presentation')
  })
})
