import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('./presentations', () => ({
  presentations: [],
}))

describe('Landing (empty registry)', () => {
  it('shows an empty-state message when no presentations are registered', async () => {
    const { default: Landing } = await import('./Landing')
    render(<Landing />)
    expect(screen.getByText('No presentations registered yet.')).toBeInTheDocument()
  })
})
