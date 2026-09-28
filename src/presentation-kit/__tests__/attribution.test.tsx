import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { ATTRIBUTION_LABEL } from '../constants'
import { buildFixtureSteps } from './fixtures'

describe('kit attribution', () => {
  it('shows a default bottom-right "made by and-scene" link with a stable hook', () => {
    render(<Presentation steps={buildFixtureSteps()} title="Fixture" />)
    const link = screen.getByRole('link', { name: ATTRIBUTION_LABEL })
    expect(link).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(link).toHaveAttribute('data-presentation-attribution')
  })

  it('does not render a default top-left and-scene brand link', () => {
    render(<Presentation steps={buildFixtureSteps()} title="Fixture" />)
    const header = document.querySelector('[data-presentation-header]')
    expect(header?.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('renders a host-provided brand explicitly, opt-in only', () => {
    render(<Presentation steps={buildFixtureSteps()} title="Fixture" brand={<span>Host Brand</span>} />)
    const header = document.querySelector('[data-presentation-header]')
    expect(header?.querySelector('[data-presentation-brand]')).toHaveTextContent('Host Brand')
  })

  it('can be overridden or hidden via attribution options', () => {
    const { rerender } = render(<Presentation steps={buildFixtureSteps()} title="Fixture" attribution={{ show: false }} />)
    expect(screen.queryByRole('link', { name: ATTRIBUTION_LABEL })).not.toBeInTheDocument()

    rerender(
      <Presentation
        steps={buildFixtureSteps()}
        title="Fixture"
        attribution={{ label: 'built with kit', href: 'https://example.com/kit' }}
      />,
    )
    const link = screen.getByRole('link', { name: 'built with kit' })
    expect(link).toHaveAttribute('href', 'https://example.com/kit')
  })
})
