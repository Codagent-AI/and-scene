import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Presentation } from '../Presentation'
import { buildFixtureSteps } from './fixtures'

describe('present and browse modes', () => {
  it('present mode shows the marker and one-line title, hiding caption/toc/progress/prev-next', () => {
    render(<Presentation steps={buildFixtureSteps(3)} title="Fixture" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-step-title]')).toHaveTextContent('Title 0')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
  })

  it('browse mode shows title, caption, toc, progress, and prev/next', () => {
    render(<Presentation steps={buildFixtureSteps(3)} title="Fixture" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
  })

  it('toggling mode preserves the current step', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={buildFixtureSteps(3)} title="Fixture" initialMode="browse" />)

    await user.click(screen.getByRole('button', { name: 'Go to step 2' }))
    const root = document.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-index', '1')

    await user.click(screen.getByRole('button', { name: 'Present' }))
    expect(root).toHaveAttribute('data-presentation-mode', 'present')
    expect(root).toHaveAttribute('data-step-index', '1')

    await user.click(screen.getByRole('button', { name: 'Browse' }))
    expect(root).toHaveAttribute('data-presentation-mode', 'browse')
    expect(root).toHaveAttribute('data-step-index', '1')
  })
})
