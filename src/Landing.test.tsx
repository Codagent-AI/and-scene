import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Landing } from './Landing'
import type { PresentationRegistryEntry } from './presentations'

describe('Landing', () => {
  it('enumerates registered presentations with a link to each', () => {
    const entries: PresentationRegistryEntry[] = [
      { slug: 'how-to-make-a-presentation', title: 'How to Make a Presentation', load: () => Promise.reject() },
      { slug: 'second-talk', title: 'A Second Talk', load: () => Promise.reject() },
    ]
    render(<Landing entries={entries} />)
    const first = screen.getByRole('link', { name: 'How to Make a Presentation' })
    expect(first).toHaveAttribute('href', '/how-to-make-a-presentation')
    const second = screen.getByRole('link', { name: 'A Second Talk' })
    expect(second).toHaveAttribute('href', '/second-talk')
  })

  it('shows a message when no presentations are registered yet', () => {
    render(<Landing entries={[]} />)
    expect(screen.getByText(/no presentations/i)).toBeInTheDocument()
  })
})
