import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Landing from './Landing'

describe('Landing', () => {
  it('renders with an empty registry', () => {
    render(<Landing registry={[]} />)
    expect(screen.getByTestId('presentation-registry')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('enumerates each registered presentation as a link to its slug', () => {
    render(
      <Landing
        registry={[
          { slug: 'how-to-make-a-presentation', title: 'How To Make A Presentation', load: async () => ({ default: () => null }) },
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: 'How To Make A Presentation' })
    expect(link).toHaveAttribute('href', '/how-to-make-a-presentation')
  })
})
