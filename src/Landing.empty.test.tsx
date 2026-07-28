import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Landing from './Landing'

describe('Landing (empty registry)', () => {
  it('shows an empty-state message when no presentations are registered', () => {
    render(<Landing />)
    expect(screen.getByText('No presentations registered yet.')).toBeInTheDocument()
  })
})
