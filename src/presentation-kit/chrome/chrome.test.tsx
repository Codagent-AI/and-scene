import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { Footer } from './Footer'
import { Toc } from './Toc'
import { Attribution, ATTRIBUTION_URL } from './Attribution'
import type { Step } from '../types'

describe('chrome primitives', () => {
  it('Header renders no default top-left brand unless host-provided', () => {
    const { container } = render(<Header marker="01" title="A title" />)
    expect(container.querySelector('[data-scene-kit="brand-slot"]')?.textContent).toBe('')
  })

  it('Header renders a host-provided brand when given one', () => {
    render(<Header marker="01" title="A title" brand={<span>Host Brand</span>} />)
    expect(screen.getByText('Host Brand')).toBeInTheDocument()
  })

  it('Header always shows the marker and the active step title', () => {
    render(<Header marker="02" title="Step title" />)
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('Step title')).toBeInTheDocument()
  })

  it('Footer renders nothing in present mode, and caption/progress/nav in browse mode', () => {
    const props = {
      caption: 'Longer caption',
      stepIndex: 1,
      stepCount: 3,
      onSelectStep: vi.fn(),
      onPrev: vi.fn(),
      onNext: vi.fn(),
      canPrev: true,
      canNext: true,
    }

    const { rerender, container } = render(<Footer mode="present" {...props} />)
    expect(container.querySelector('[data-scene-kit="footer"]')).toBeNull()

    rerender(<Footer mode="browse" {...props} />)
    expect(screen.getByText('Longer caption')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-scene-kit="progress-dot"]')).toHaveLength(3)
  })

  it('Footer progress dots expose active state and jump on click', async () => {
    const user = userEvent.setup()
    const onSelectStep = vi.fn()
    const { container } = render(
      <Footer
        mode="browse"
        caption="c"
        stepIndex={1}
        stepCount={3}
        onSelectStep={onSelectStep}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        canPrev
        canNext
      />,
    )

    const dots = container.querySelectorAll('[data-scene-kit="progress-dot"]')
    expect(dots).toHaveLength(3)
    expect(dots[1].getAttribute('data-active')).toBe('true')
    expect(dots[0].getAttribute('data-active')).toBe('false')

    await user.click(dots[2] as HTMLElement)
    expect(onSelectStep).toHaveBeenCalledWith(2)
  })

  it('Footer disables prev/next at boundaries', () => {
    const { container } = render(
      <Footer
        mode="browse"
        caption="c"
        stepIndex={0}
        stepCount={3}
        onSelectStep={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        canPrev={false}
        canNext
      />,
    )
    expect(container.querySelector('[data-scene-kit="prev-button"]')).toBeDisabled()
    expect(container.querySelector('[data-scene-kit="next-button"]')).not.toBeDisabled()
  })

  it('Toc jumps to the first step of a section and exposes active state', async () => {
    const user = userEvent.setup()
    const steps: Step<null>[] = [
      { id: 'a', section: 'Intro', title: 'A', caption: 'a', Scene: () => null, payload: null },
      { id: 'b', section: 'Intro', title: 'B', caption: 'b', Scene: () => null, payload: null },
      { id: 'c', section: 'Middle', title: 'C', caption: 'c', Scene: () => null, payload: null },
    ]
    const onSelectSection = vi.fn()
    const { container } = render(<Toc steps={steps} activeIndex={2} onSelectSection={onSelectSection} />)

    const entries = container.querySelectorAll('[data-scene-kit="toc-entry"]')
    expect(entries).toHaveLength(2)
    expect(entries[1].getAttribute('data-active')).toBe('true')
    expect(entries[0].getAttribute('data-active')).toBe('false')

    await user.click(entries[0] as HTMLElement)
    expect(onSelectSection).toHaveBeenCalledWith(0)
  })

  it('Attribution links to the and-scene GitHub repo with a stable hook', () => {
    render(<Attribution />)
    const link = screen.getByText('made by and-scene')
    expect(link).toHaveAttribute('href', ATTRIBUTION_URL)
    expect(link).toHaveAttribute('data-scene-kit', 'attribution')
  })
})
