import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from '../../../src/presentation-kit/index.ts'
import { makeSteps, setViewport } from '../helpers/fixtures.tsx'

vi.mock('motion/react', async () => (await import('../helpers/motionMock.tsx')).motionModule)

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-presentation-root]')!
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

beforeEach(() => setViewport(1280, 800))

describe('markers and numbering (L-2)', () => {
  it('derives the marker from position after reordering and removal', () => {
    const steps = makeSteps(4)
    const { container, rerender } = render(<Presentation steps={steps} title="T" />)
    const marker = () => container.querySelector('[data-presentation-marker]')!.textContent
    key('ArrowRight')
    key('ArrowRight')
    expect(marker()).toBe('03')
    expect(screen.getAllByText('Title 3').length).toBeGreaterThan(0)
    rerender(<Presentation steps={[steps[2], steps[0], steps[1], steps[3]]} title="T" />)
    expect(marker()).toBe('03')
    expect(container.querySelector('[data-presentation-header-title]')!.textContent).toBe('Title 2')
    rerender(<Presentation steps={[steps[2], steps[3]]} title="T" />)
    expect(container.querySelector('[data-step-count]')!.getAttribute('data-step-count')).toBe('2')
    key('ArrowLeft')
    expect(marker()).toBe('01')
  })

  it('stays on the clamped step when steps shrink', () => {
    const steps = makeSteps(4)
    const { container, rerender } = render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    rerender(<Presentation steps={steps.slice(0, 2)} title="T" />)
    expect(container.querySelector('[data-presentation-marker]')!.textContent).toMatch(/^0[12]$/)
  })
})

describe('present mode (L-15)', () => {
  it('shows marker and title only', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" initialMode="present" />)
    expect(container.querySelector('[data-presentation-marker]')!.textContent).toBe('01')
    expect(container.querySelector('[data-presentation-title]')!.textContent).toBe('Title 1')
    for (const hidden of ['caption', 'toc', 'prev', 'next', 'dot', 'progress', 'header-title']) {
      expect(container.querySelector(`[data-presentation-${hidden}]`), hidden).toBeNull()
    }
  })
})

describe('browse mode (L-16)', () => {
  it('shows title, caption, ToC, prev/next and progress at 900px', () => {
    setViewport(900)
    const { container } = render(<Presentation steps={makeSteps()} title="T" initialMode="browse" />)
    expect(container.querySelector('[data-presentation-header-title]')!.textContent).toBe('Title 1')
    expect(container.querySelector('[data-presentation-caption]')!.textContent).toMatch(/several lines/)
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-dot]')).toHaveLength(6)
  })

  it('hides the ToC at 899px but keeps the rest', () => {
    setViewport(899)
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-dot]')).toHaveLength(6)
  })

  it('shows the toc after resizing across the boundary', () => {
    setViewport(600)
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    act(() => setViewport(1000))
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('updates narration when the step changes', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    key('ArrowRight')
    expect(container.querySelector('[data-presentation-header-title]')!.textContent).toBe('Title 2')
    expect(container.querySelector('[data-presentation-caption]')!.textContent).toMatch(/^Caption 2/)
  })
})

describe('mode toggling (L-17, C-3)', () => {
  it('keeps the step across P and mirrors the public hooks', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    const hooks = () => {
      const r = root(container)
      return [r.dataset.stepCount, r.dataset.stepIndex, r.dataset.presentationMode]
    }
    expect(hooks()).toEqual(['6', '0', 'browse'])
    key('ArrowRight')
    key('ArrowRight')
    expect(hooks()).toEqual(['6', '2', 'browse'])
    key('p')
    expect(hooks()).toEqual(['6', '2', 'present'])
    expect(container.querySelector('[data-presentation-title]')!.textContent).toBe('Title 3')
    expect(container.querySelector('[data-presentation-dot]')).toBeNull()
    key('p')
    expect(hooks()).toEqual(['6', '2', 'browse'])
    act(() => void fireEvent.click(container.querySelectorAll<HTMLElement>('[data-presentation-dot]')[4]))
    expect(hooks()).toEqual(['6', '4', 'browse'])
    expect(container.querySelector('[data-presentation-header-title]')!.textContent).toBe('Title 5')
  })
})

describe('direct jumps and active state (L-20, L-21)', () => {
  it('jumps from non-adjacent steps with dots', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    const dots = () => [...container.querySelectorAll<HTMLElement>('[data-presentation-dot]')]
    fireEvent.click(dots()[5])
    expect(root(container).dataset.stepIndex).toBe('5')
    fireEvent.click(dots()[1])
    expect(root(container).dataset.stepIndex).toBe('1')
  })

  it('jumps to the first step of an era from any step, including mid-era', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    const entries = () => [...container.querySelectorAll<HTMLElement>('[data-presentation-toc-entry]')]
    expect(entries().map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(entries()[2])
    expect(root(container).dataset.stepIndex).toBe('5')
    fireEvent.click(entries()[1])
    expect(root(container).dataset.stepIndex).toBe('2')
    key('ArrowRight')
    key('ArrowRight') // mid-era (index 4)
    fireEvent.click(entries()[1])
    expect(root(container).dataset.stepIndex).toBe('2')
    fireEvent.click(entries()[0])
    expect(root(container).dataset.stepIndex).toBe('0')
  })

  it('exposes current state that moves with navigation', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    const check = (dot: number, era: number) => {
      const dots = [...container.querySelectorAll('[data-presentation-dot]')]
      const eras = [...container.querySelectorAll('[data-presentation-toc-entry]')]
      dots.forEach((d, i) => {
        expect(d.getAttribute('aria-current')).toBe(i === dot ? 'step' : null)
        expect(d.getAttribute('data-presentation-active')).toBe(i === dot ? 'true' : null)
      })
      eras.forEach((e, i) => {
        expect(e.getAttribute('aria-current')).toBe(i === era ? 'true' : null)
        expect(e.getAttribute('data-presentation-active')).toBe(i === era ? 'true' : null)
      })
    }
    check(0, 0)
    key('ArrowRight')
    check(1, 0)
    key('ArrowRight') // crosses into era two
    check(2, 1)
    fireEvent.click(container.querySelectorAll('[data-presentation-dot]')[5])
    check(5, 2)
  })
})

describe('on-screen controls (L-53)', () => {
  it('moves one step with next/prev and clamps', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="T" />)
    const next = container.querySelector<HTMLElement>('[data-presentation-next]')!
    const prev = container.querySelector<HTMLElement>('[data-presentation-prev]')!
    const caption = () => container.querySelector('[data-presentation-caption]')!.textContent
    fireEvent.click(prev)
    expect(caption()).toMatch(/^Caption 1/)
    fireEvent.click(next)
    expect(caption()).toMatch(/^Caption 2/)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(caption()).toMatch(/^Caption 3/)
    fireEvent.click(prev)
    expect(caption()).toMatch(/^Caption 2/)
  })

  it('releases focus after a pointer click so arrow keys keep working', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="T" />)
    const dot = container.querySelectorAll<HTMLElement>('[data-presentation-dot]')[1]
    dot.focus()
    fireEvent.click(dot, { detail: 1 })
    expect(document.activeElement).not.toBe(dot)
    key('ArrowRight')
    expect(root(container).dataset.stepIndex).toBe('2')
  })

  it('keeps focus after keyboard activation', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="T" />)
    const dot = container.querySelectorAll<HTMLElement>('[data-presentation-dot]')[1]
    dot.focus()
    fireEvent.click(dot, { detail: 0 })
    expect(document.activeElement).toBe(dot)
  })
})

describe('header brand and attribution (L-12..L-14, C-8)', () => {
  it('renders no default and-scene brand in the header', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" />)
    const header = container.querySelector<HTMLElement>('[data-presentation-header]')!
    expect(within(header).queryByText(/and-scene/i)).toBeNull()
    expect(header.querySelector('a')).toBeNull()
    expect(header.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('renders a host-provided brand in the header slot', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" brand={<a href="/host">Host</a>} />)
    const brand = container.querySelector('[data-presentation-header] [data-presentation-brand] a')!
    expect(brand.getAttribute('href')).toBe('/host')
  })

  it.each(['browse', 'present'] as const)('shows the default attribution in %s mode', (mode) => {
    const { container } = render(<Presentation steps={makeSteps()} title="T" initialMode={mode} />)
    const link = container.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.style.position).toBe('fixed')
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
  })

  it('lets options override the link and falls back to defaults when omitted', () => {
    const { container, rerender } = render(
      <Presentation steps={makeSteps()} title="T" attribution={{ label: 'built with X', href: 'https://example.com' }} />,
    )
    const link = () => container.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link().textContent).toBe('built with X')
    expect(link().getAttribute('href')).toBe('https://example.com')
    rerender(<Presentation steps={makeSteps()} title="T" attribution={{}} />)
    expect(link().textContent).toBe('made by and-scene')
    rerender(<Presentation steps={makeSteps()} title="T" attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('StrictMode (L-78)', () => {
  it('advances once per key press and toggles mode once', () => {
    const { container } = render(
      <StrictMode>
        <Presentation steps={makeSteps()} title="T" />
      </StrictMode>,
    )
    key('ArrowRight')
    expect(root(container).dataset.stepIndex).toBe('1')
    key('p')
    expect(root(container).dataset.presentationMode).toBe('present')
  })
})

describe('validation at the boundary (L-1)', () => {
  it('throws for duplicate ids', () => {
    const steps = makeSteps(2)
    steps[1] = { ...steps[1], id: steps[0].id }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Presentation steps={steps} title="T" />)).toThrow(/Duplicate/)
  })
})
