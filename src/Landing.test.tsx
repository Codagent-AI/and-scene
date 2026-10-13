import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Landing } from './Landing'

describe('Landing', () => {
  afterEach(cleanup)

  it('renders the registered reference presentation', () => {
    render(<Landing />)
    expect(screen.getByRole('heading', { name: 'Presentations as evolving diagrams.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How to Use This Skill to Make a Presentation' })).toHaveAttribute('href', '/how-to-make-a-presentation')
  })
})
