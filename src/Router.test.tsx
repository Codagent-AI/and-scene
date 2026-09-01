import { render, screen } from '@testing-library/react'
import { createAppRouter } from './Router'

describe('pathname router', () => {
  it('uses the landing page at root and lazy-loads an explicitly registered route', async () => {
    const Router = createAppRouter([
      {
        slug: 'example',
        title: 'Example',
        load: async () => ({ default: () => <h1>Example presentation</h1> }),
      },
    ])

    window.history.pushState({}, '', '/')
    const view = render(<Router />)
    expect(screen.getByRole('link', { name: 'How to Use This Skill to Make a Presentation' }))
      .toHaveAttribute('href', '/how-to-make-a-presentation')

    window.history.pushState({}, '', '/example')
    view.rerender(<Router />)
    expect(await screen.findByRole('heading', { name: 'Example presentation' })).toBeInTheDocument()
  })

  it('does not match extra pathname segments to a single-segment route', () => {
    const Router = createAppRouter([
      {
        slug: 'example',
        title: 'Example',
        load: async () => ({ default: () => <h1>Example presentation</h1> }),
      },
    ])

    window.history.pushState({}, '', '/example/extra')
    render(<Router />)

    expect(screen.getByRole('heading', { name: 'Presentations' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Example presentation' })).not.toBeInTheDocument()
  })
})
