import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Attribution } from './Attribution'
import { Footer } from './Footer'
import { Header } from './Header'
import { Toc } from './Toc'
import type { Step } from '../types'

describe('Attribution', () => {
  it('renders a bottom-right "made by and-scene" link to the and-scene GitHub repository with a stable hook', () => {
    render(<Attribution />)
    const link = screen.getByRole('link', { name: /made by and-scene/i })
    expect(link).toHaveAttribute('data-presentation-attribution', '')
    expect(link.getAttribute('href')).toMatch(/^https:\/\/github\.com\//)
  })
})

describe('Header', () => {
  it('always renders the step marker', () => {
    render(<Header mode="present" marker="02" title="A title" />)
    expect(screen.getByText('02')).toBeInTheDocument()
  })

  it('shows the title in browse mode', () => {
    render(<Header mode="browse" marker="02" title="A title" />)
    expect(screen.getByText('A title')).toBeInTheDocument()
  })

  it('does not render a default top-left and-scene brand link', () => {
    render(<Header mode="browse" marker="02" title="A title" />)
    expect(screen.queryByText(/and-scene/i)).not.toBeInTheDocument()
  })

  it('renders host-provided brand content when supplied', () => {
    render(<Header mode="browse" marker="02" title="A title" brand={<span>Host Brand</span>} />)
    expect(screen.getByText('Host Brand')).toBeInTheDocument()
  })
})

describe('Footer', () => {
  const noop = () => {}

  it('present mode shows only the one-line title; caption, toc controls, and prev/next are hidden', () => {
    render(
      <Footer
        mode="present"
        title="Present title"
        caption="A longer caption paragraph."
        stepCount={3}
        activeIndex={1}
        onGoTo={noop}
        onNext={noop}
        onPrev={noop}
      />,
    )
    expect(screen.getByText('Present title')).toBeInTheDocument()
    expect(screen.queryByText('A longer caption paragraph.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prev/i })).not.toBeInTheDocument()
  })

  it('browse mode shows the caption, progress dots, and prev/next controls', () => {
    render(
      <Footer
        mode="browse"
        title="Browse title"
        caption="A longer caption paragraph."
        stepCount={3}
        activeIndex={1}
        onGoTo={noop}
        onNext={noop}
        onPrev={noop}
      />,
    )
    expect(screen.getByText('A longer caption paragraph.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument()
    expect(screen.getAllByTestId('progress-dot')).toHaveLength(3)
  })

  it('exposes semantic active state and a stable hook on the active progress dot', () => {
    render(
      <Footer
        mode="browse"
        title="Browse title"
        caption="caption"
        stepCount={3}
        activeIndex={1}
        onGoTo={noop}
        onNext={noop}
        onPrev={noop}
      />,
    )
    const dots = screen.getAllByTestId('progress-dot')
    expect(dots[1]).toHaveAttribute('aria-current', 'step')
    expect(dots[1]).toHaveAttribute('data-active', 'true')
    expect(dots[0]).toHaveAttribute('data-active', 'false')
    expect(dots[0]).not.toHaveAttribute('aria-current')
  })

  it('jumps directly to a step when its progress dot is activated', async () => {
    const onGoTo = vi.fn()
    render(
      <Footer
        mode="browse"
        title="t"
        caption="c"
        stepCount={3}
        activeIndex={0}
        onGoTo={onGoTo}
        onNext={noop}
        onPrev={noop}
      />,
    )
    screen.getAllByTestId('progress-dot')[2].click()
    expect(onGoTo).toHaveBeenCalledWith(2)
  })

  it('clamps next/prev calls at the boundaries via the passed handlers being disabled', () => {
    render(
      <Footer mode="browse" title="t" caption="c" stepCount={3} activeIndex={0} onGoTo={noop} onNext={noop} onPrev={noop} />,
    )
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })
})

describe('Toc', () => {
  const steps: Step<null>[] = [
    { id: 'a', era: 'Intro', title: 'A', caption: 'ca', payload: null, Scene: () => null },
    { id: 'b', era: 'Intro', title: 'B', caption: 'cb', payload: null, Scene: () => null },
    { id: 'c', era: 'Deep dive', title: 'C', caption: 'cc', payload: null, Scene: () => null },
  ]

  it('groups steps by era and exposes one entry per era', () => {
    render(<Toc steps={steps} activeIndex={0} onSelectEra={() => {}} />)
    expect(screen.getByText('Intro')).toBeInTheDocument()
    expect(screen.getByText('Deep dive')).toBeInTheDocument()
  })

  it('marks the era containing the active step with semantic current state and a stable hook', () => {
    render(<Toc steps={steps} activeIndex={2} onSelectEra={() => {}} />)
    const entries = screen.getAllByTestId('toc-entry')
    const deepDive = entries.find((entry) => entry.textContent === 'Deep dive')
    const intro = entries.find((entry) => entry.textContent === 'Intro')
    expect(deepDive).toHaveAttribute('aria-current', 'true')
    expect(deepDive).toHaveAttribute('data-active', 'true')
    expect(intro).toHaveAttribute('data-active', 'false')
  })

  it('jumps to the first step of an era when its entry is activated', () => {
    const onSelectEra = vi.fn()
    render(<Toc steps={steps} activeIndex={0} onSelectEra={onSelectEra} />)
    screen.getByText('Deep dive').click()
    expect(onSelectEra).toHaveBeenCalledWith(2)
  })
})
