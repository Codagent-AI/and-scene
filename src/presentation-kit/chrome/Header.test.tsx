import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders the step marker in present mode without the step title', () => {
    render(<Header mode="present" era="Origins" title="The spark" stepIndex={0} stepCount={5} />)
    expect(screen.getByTestId('presentation-header')).toHaveAttribute(
      'data-presentation-chrome',
      'header',
    )
    expect(screen.getByText('Origins')).toBeInTheDocument()
    expect(screen.queryByText('The spark')).not.toBeInTheDocument()
  })

  it('renders the step marker and title in browse mode', () => {
    render(<Header mode="browse" era="Origins" title="The spark" stepIndex={0} stepCount={5} />)
    expect(screen.getByText('Origins')).toBeInTheDocument()
    expect(screen.getByText('The spark')).toBeInTheDocument()
  })

  it('does not render a default top-left and-scene brand', () => {
    render(<Header mode="browse" era="Origins" title="The spark" stepIndex={0} stepCount={5} />)
    expect(screen.queryByText('and-scene')).not.toBeInTheDocument()
  })

  it('renders host-provided branding only when explicitly supplied', () => {
    render(
      <Header
        mode="browse"
        era="Origins"
        title="The spark"
        stepIndex={0}
        stepCount={5}
        brand={<span>Acme Corp</span>}
      />,
    )
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })
})
