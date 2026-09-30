import { render, screen } from '@testing-library/react'
import App from './App'

describe('application landing', () => {
  it('shows the registered presentation directory', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Presentations' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How to Use This Skill to Make a Presentation' }))
      .toHaveAttribute('href', '/how-to-make-a-presentation')
  })
})
