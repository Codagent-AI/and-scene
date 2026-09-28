import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { buildFixtureSteps } from './fixtures'

describe('active navigation state', () => {
  it('marks the active progress dot with a semantic current-step hook and a stable active hook', () => {
    render(<Presentation steps={buildFixtureSteps(3)} title="Fixture" initialMode="browse" />)
    const dots = screen.getAllByRole('button', { name: /Go to step/ })
    expect(dots[0]).toHaveAttribute('aria-current', 'step')
    expect(dots[0]).toHaveAttribute('data-presentation-active', 'true')
    expect(dots[1]).toHaveAttribute('data-presentation-active', 'false')
    expect(dots[1]).not.toHaveAttribute('aria-current')
  })

  it('marks the table-of-contents entry for the active step era', () => {
    render(<Presentation steps={buildFixtureSteps(3)} title="Fixture" initialMode="browse" />)
    const tocItems = document.querySelectorAll('[data-presentation-toc-item]')
    const activeItem = Array.from(tocItems).find((item) => item.getAttribute('data-presentation-active') === 'true')
    expect(activeItem).toHaveTextContent('Intro')
    expect(activeItem).toHaveAttribute('aria-current', 'true')
  })
})
