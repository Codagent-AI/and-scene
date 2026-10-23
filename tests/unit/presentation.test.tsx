// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps, mounts, stubMatchMedia } from './fixtures'

beforeEach(() => {
  mounts.count = 0
  stubMatchMedia(true)
})

afterEach(() => {
  document.body.innerHTML = ''
})

function root(container: HTMLElement) {
  return container.querySelector('[data-presentation-root]') as HTMLElement
}

describe('Presentation chrome and modes', () => {
  it('shows each step its own caption and title, with next and previous moving once per step', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} initialMode="browse" />)
    const steps = makeSteps()
    for (let i = 0; i < steps.length; i += 1) {
      expect(root(container).getAttribute('data-step-index')).toBe(String(i))
      expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe(steps[i].title)
      expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe(steps[i].caption)
      if (i < steps.length - 1) fireEvent.click(container.querySelector('[data-presentation-next]')!)
    }
    expect(root(container).getAttribute('data-step-index')).toBe('3')
  })

  it('derives step numbers from position after reordering, insertion, and removal', () => {
    const steps = makeSteps()
    const { container, rerender } = render(<Presentation title="Deck" steps={steps} />)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-dot]')[2])
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('03 · second era')
    rerender(<Presentation title="Deck" steps={[...steps].reverse()} />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('03 · first era')
    // A new step with its own stable id is inserted before the current position.
    const inserted = { ...makeSteps()[0], id: 'inserted', title: 'Inserted', era: 'third era' }
    const reversed = [...steps].reverse()
    const withInsert = [reversed[0], inserted, ...reversed.slice(1)]
    rerender(<Presentation title="Deck" steps={withInsert} />)
    expect(container.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(5)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe(`03 · ${withInsert[2].era}`)
    // The step at the current position is removed; numbering follows the new positions.
    const withoutFirst = steps.slice(1)
    rerender(<Presentation title="Deck" steps={withoutFirst} />)
    expect(container.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(3)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe(`03 · ${withoutFirst[2].era}`)
  })

  it('reports step count and index hooks in both modes', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    expect(root(container).getAttribute('data-step-count')).toBe('4')
    fireEvent.keyDown(window, { key: 'p' })
    expect(root(container).getAttribute('data-step-count')).toBe('4')
    expect(root(container).getAttribute('data-step-index')).toBe('0')
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
  })

  it('present mode renders the marker and title, and no caption, ToC, controls, or dots', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} initialMode="present" />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 · first era')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Alpha')
    expect(container.querySelector('[data-presentation-caption]')).toBeNull()
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-controls]')).toBeNull()
    expect(container.querySelector('[data-presentation-progress-dot]')).toBeNull()
  })

  it('browse mode shows title, caption, controls, and progress dots', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} initialMode="browse" />)
    expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('Alpha')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption alpha.')
    expect(container.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(4)
    expect(container.querySelector('[data-presentation-deck-title]')?.textContent).toBe('Deck')
  })

  it('shows the ToC only at or above the wide breakpoint in browse mode', () => {
    stubMatchMedia(false)
    const narrow = render(<Presentation title="Deck" steps={makeSteps()} initialMode="browse" />)
    expect(narrow.container.querySelector('[data-presentation-toc]')).toBeNull()
    narrow.unmount()

    stubMatchMedia(true)
    const wide = render(<Presentation title="Deck" steps={makeSteps()} initialMode="browse" />)
    expect(wide.container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('keeps the step when toggling mode, and does not remount a grouped scene', () => {
    const steps = makeSteps({ groupKey: 'g' })
    const { container } = render(<Presentation title="Deck" steps={steps} initialMode="browse" />)
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    const before = mounts.count
    fireEvent.keyDown(window, { key: 'p' })
    fireEvent.keyDown(window, { key: 'p' })
    expect(root(container).getAttribute('data-step-index')).toBe('2')
    expect(mounts.count).toBe(before)
  })
})

describe('Presentation navigation controls', () => {
  it('direct jump from a progress dot selects that step', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-dot]')[2])
    expect(root(container).getAttribute('data-step-index')).toBe('2')
  })

  it('a ToC entry jumps to the first step of its era', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const entries = container.querySelectorAll('[data-presentation-toc-entry]')
    expect(entries).toHaveLength(2)
    fireEvent.click(entries[1])
    expect(root(container).getAttribute('data-step-index')).toBe('2')
    expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('Gamma')
  })

  it('on every step, exactly one dot and one era entry carry current-step semantics and the active hook', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const steps = makeSteps()
    for (let i = 0; i < steps.length; i += 1) {
      fireEvent.click(container.querySelectorAll('[data-presentation-progress-dot]')[i])
      const dots = [...container.querySelectorAll('[data-presentation-progress-dot]')]
      expect(dots.filter((d) => d.getAttribute('aria-current') === 'step'), `dots at ${i}`).toHaveLength(1)
      expect(dots.filter((d) => d.getAttribute('data-presentation-active') === 'true')).toHaveLength(1)
      expect(dots[i].getAttribute('aria-current')).toBe('step')
      const entries = [...container.querySelectorAll('[data-presentation-toc-entry]')]
      const activeEra = steps[i].era
      entries.forEach((entry) => {
        const active = entry.textContent === activeEra
        expect(entry.getAttribute('data-presentation-active') === 'true', `era ${entry.textContent} at ${i}`).toBe(active)
        expect(entry.getAttribute('aria-current') === 'step', `aria at ${i}`).toBe(active)
      })
    }
  })

  it('the title, caption, and scene payload agree with the active index', async () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const steps = makeSteps()
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-dot]')[2])
    expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe(steps[2].title)
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe(steps[2].caption)
    // The outgoing scene exits before it is removed, so wait until only the active scene remains.
    await waitFor(() => expect(screen.getAllByTestId('scene')).toHaveLength(1), { timeout: 4000 })
    expect(screen.getByTestId('scene').getAttribute('data-payload')).toBe(steps[2].payload)
  })

  it('next walks forward and previous walks back through every step of the fixture', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} initialMode="browse" />)
    const next = container.querySelector('[data-presentation-next]') as HTMLElement
    const prev = container.querySelector('[data-presentation-prev]') as HTMLElement
    const index = () => root(container).getAttribute('data-step-index')
    fireEvent.click(next)
    expect(index()).toBe('1')
    fireEvent.click(next)
    expect(index()).toBe('2')
    fireEvent.click(next)
    expect(index()).toBe('3')
    fireEvent.click(prev)
    expect(index()).toBe('2')
    fireEvent.click(prev)
    expect(index()).toBe('1')
    fireEvent.click(prev)
    expect(index()).toBe('0')
  })

  it('prev and next are disabled at the ends and do nothing there', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const prev = container.querySelector('[data-presentation-prev]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    expect(root(container).getAttribute('data-step-index')).toBe('0')
    act(() => {
      fireEvent.click(container.querySelectorAll('[data-presentation-progress-dot]')[3])
    })
    const next = container.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(root(container).getAttribute('data-step-index')).toBe('3')
  })

  it('a focused control keeps its keys: arrow keys inside a button do not move the deck', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const next = container.querySelector('[data-presentation-next]') as HTMLButtonElement
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    fireEvent.keyDown(next, { key: ' ' })
    expect(root(container).getAttribute('data-step-index')).toBe('0')
  })
})

describe('Presentation attribution and branding', () => {
  it('shows exactly one "made by and-scene" link to the GitHub repository in both modes', () => {
    for (const mode of ['browse', 'present'] as const) {
      const { container, unmount } = render(<Presentation title="Deck" steps={makeSteps()} initialMode={mode} />)
      const links = container.querySelectorAll('a')
      const attribution = within(container).getAllByText('made by and-scene')
      expect(attribution).toHaveLength(1)
      expect(links).toHaveLength(1)
      expect(attribution[0].getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(container.querySelector('[data-presentation-attribution-slot="bottom-right"]')).not.toBeNull()
      const slot = container.querySelector('[data-presentation-attribution-slot]') as HTMLElement
      expect(slot.style.right).toBe('8px')
      expect(slot.style.bottom).toBe('4px')
      unmount()
    }
  })

  it('the attribution link exposes a stable styling hook', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    expect(container.querySelector('a[data-presentation-attribution]')).not.toBeNull()
  })

  it('omits the attribution link entirely when hideAttribution is set', () => {
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} hideAttribution />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
    expect(container.querySelector('[data-presentation-attribution-slot]')).toBeNull()
  })

  it('the top-left brand slot is empty by default, and renders a host brand when provided', () => {
    const { container, unmount } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const brand = container.querySelector('[data-presentation-brand]') as HTMLElement
    expect(brand.textContent).toBe('')
    expect(brand.querySelector('a')).toBeNull()
    unmount()
    const withBrand = render(<Presentation title="Deck" steps={makeSteps()} brand={<a href="/">Host</a>} />)
    expect(withBrand.container.querySelector('[data-presentation-brand] a')?.textContent).toBe('Host')
  })
})

describe('Presentation under StrictMode', () => {
  it('grouped scene keeps one instance across navigation after the initial mount', () => {
    const steps = makeSteps({ groupKey: 'deck' })
    const { container } = render(
      <StrictMode>
        <Presentation title="Deck" steps={steps} />
      </StrictMode>,
    )
    const initial = mounts.count
    const sceneNode = container.querySelector('[data-testid="scene"]')
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(mounts.count).toBe(initial)
    expect(container.querySelector('[data-testid="scene"]')).toBe(sceneNode)
    expect(screen.getByTestId('scene').getAttribute('data-payload')).toBe('c')
  })
})
