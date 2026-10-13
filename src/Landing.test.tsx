import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Landing } from './Landing'

describe('Landing', () => {
  afterEach(cleanup)

  it('renders cleanly when the explicit registry is empty', () => {
    render(<Landing />)
    expect(screen.getByRole('heading', { name: 'Presentations as evolving diagrams.' })).toBeInTheDocument()
    expect(screen.getByText('No presentations yet.')).toBeInTheDocument()
  })
})
