import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Landing } from '../../../src/Landing'

describe('Landing', () => {
  it('renders sensibly with an empty registry', () => {
    render(<Landing entries={[]} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByText(/no presentations/i)).toBeTruthy()
  })

  it('links each registered presentation by its slug', () => {
    render(
      <Landing
        entries={[
          { slug: 'alpha', title: 'Alpha talk', load: () => Promise.resolve({ default: () => null }) },
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: 'Alpha talk' })
    expect(link.getAttribute('href')).toBe('/alpha')
  })
})
