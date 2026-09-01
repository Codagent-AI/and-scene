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
})
