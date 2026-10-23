// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from '../../src/presentation-kit/Presentation'
import type { Step } from '../../src/presentation-kit/types'
import { SAMPLE_STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { NORMATIVE_OUTLINE } from '../../scripts/lib/sample-outline.mjs'

vi.mock('motion/react', () => import('./support/motionMock'))

type Payload = { label: string }
const Scene = ({ payload }: { payload: Payload }) => <div data-testid="scene">{payload.label}</div>

function makeSteps(names: string[], era = 'first'): Step<Payload>[] {
  return names.map((name, index) => ({
    id: `id-${name}`,
    era: index < 2 ? era : `${era}-later`,
    title: `Title ${name}`,
    caption: `Caption for ${name}, a longer browse paragraph.`,
    groupKey: 'group',
    scene: Scene,
    payload: { label: `scene ${name}` },
  }))
}

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const stepIndex = () => Number(root().getAttribute('data-step-index'))
const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1440)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('scene step model', () => {
  it('shows each step\'s era, title, caption, and scene payload as it becomes active', () => {
    const steps = makeSteps(['a', 'b', 'c'])
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(screen.getByTestId('scene').textContent).toBe('scene a')
    expect(screen.getByText('Caption for a, a longer browse paragraph.', { selector: '[data-presentation-caption]' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByTestId('scene').textContent).toBe('scene b')
    expect(root().querySelector('[data-presentation-marker-era]')?.textContent).toBe('first')
    expect(document.querySelector('[data-presentation-step-title]')?.textContent).toBe('Title b')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(root().querySelector('[data-presentation-marker-era]')?.textContent).toBe('first-later')
  })

  it('numbers steps from their position in the current array', () => {
    const original = makeSteps(['a', 'b', 'c', 'd'])
    const { rerender } = render(<Presentation steps={original} title="Deck" initialMode="browse" />)
    const numberText = () => root().querySelector('[data-presentation-marker-number]')?.textContent
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(numberText()).toBe('2 / 4')

    const inserted = [original[0], { ...original[1], id: 'new', title: 'Inserted' }, ...original.slice(1)]
    rerender(<Presentation steps={inserted} title="Deck" initialMode="browse" />)
    expect(numberText()).toBe('2 / 5')

    const reordered = [original[2], original[0], original[1], original[3]]
    rerender(<Presentation steps={reordered} title="Deck" initialMode="browse" />)
    expect(numberText()).toBe('2 / 4')
    expect(document.querySelector('[data-presentation-step-title]')?.textContent).toBe('Title a')

    const removed = [original[0], original[2]]
    rerender(<Presentation steps={removed} title="Deck" initialMode="browse" />)
    expect(numberText()).toBe('2 / 2')
  })

  it('keeps stable step ids unique in the sample', () => {
    const ids = SAMPLE_STEPS.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('present and browse chrome', () => {
  it('present mode shows marker and one-line title, hiding caption, ToC, controls, and progress', () => {
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="present" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-step-title]')?.textContent).toBe('Title a')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
  })

  it('present mode keeps its marker and one-line title at a narrow width', () => {
    vi.stubGlobal('innerWidth', 390)
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="present" />)
    expect(root().querySelector('[data-presentation-marker-number]')?.textContent).toBe('1 / 3')
    expect(document.querySelector('[data-presentation-step-title]')?.textContent).toBe('Title a')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('browse mode shows title, caption, controls, and progress', () => {
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-deck-title]')?.textContent).toBe('Deck')
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption for a, a longer browse paragraph.')
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress]')).toHaveLength(3)
  })

  it('shows the table of contents only in browse mode at or above the wide breakpoint', () => {
    const steps = makeSteps(['a', 'b', 'c'])
    const { unmount } = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    unmount()

    vi.stubGlobal('innerWidth', 1023)
    const narrow = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    narrow.unmount()

    vi.stubGlobal('innerWidth', 1024)
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('opens in the mode it declares and toggles from the on-screen control in both modes', () => {
    const steps = makeSteps(['a', 'b', 'c'])
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    const toggle = document.querySelector('[data-presentation-mode-toggle]') as HTMLElement
    fireEvent.click(toggle)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(stepIndex()).toBe(1)
    fireEvent.click(document.querySelector('[data-presentation-mode-toggle]') as HTMLElement)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(stepIndex()).toBe(1)
  })

  it('exposes step count and index on the chrome in both modes', () => {
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="present" />)
    expect(root().getAttribute('data-step-count')).toBe('3')
    expect(root().getAttribute('data-step-index')).toBe('0')
    press('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('1')
    press('p')
    expect(root().getAttribute('data-step-index')).toBe('1')
    expect(root().getAttribute('data-step-count')).toBe('3')
  })
})

describe('direct jumps and active state', () => {
  const steps = makeSteps(['a', 'b', 'c', 'd'], 'era-one')

  it('progress controls jump to their step and expose current-step state', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const progress = Array.from(document.querySelectorAll<HTMLElement>('[data-presentation-progress]'))
    fireEvent.click(progress[3])
    expect(stepIndex()).toBe(3)
    expect(progress[3].getAttribute('aria-current')).toBe('step')
    expect(progress[3].getAttribute('data-presentation-active')).toBe('true')
    expect(progress[0].hasAttribute('aria-current')).toBe(false)
    expect(progress[0].hasAttribute('data-presentation-active')).toBe(false)
    fireEvent.click(progress[1])
    expect(stepIndex()).toBe(1)
    expect(document.querySelectorAll('[data-presentation-active="true"][data-presentation-progress]')).toHaveLength(1)
  })

  it('table-of-contents entries jump to the first step of their era', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const toc = within(document.querySelector('[data-presentation-toc]') as HTMLElement)
    const entries = toc.getAllByRole('button')
    expect(entries.map((entry) => entry.textContent)).toEqual(['era-one', 'era-one-later'])
    fireEvent.click(entries[1])
    expect(stepIndex()).toBe(2)
    expect(entries[1].getAttribute('aria-current')).toBe('step')
    expect(entries[1].getAttribute('data-presentation-active')).toBe('true')
    expect(entries[0].hasAttribute('aria-current')).toBe(false)
    expect(entries[0].hasAttribute('data-presentation-active')).toBe(false)
    fireEvent.click(entries[0])
    expect(stepIndex()).toBe(0)
    expect(entries[0].getAttribute('aria-current')).toBe('step')
    expect(entries[0].getAttribute('data-presentation-active')).toBe('true')
    expect(entries[1].hasAttribute('aria-current')).toBe(false)
    expect(entries[1].hasAttribute('data-presentation-active')).toBe(false)
  })

  it('jumps to every era entry of the sample, including backward', () => {
    render(<Presentation steps={SAMPLE_STEPS} title="Deck" initialMode="browse" />)
    const toc = within(document.querySelector('[data-presentation-toc]') as HTMLElement)
    const eras = [...new Set(NORMATIVE_OUTLINE.map((step) => step.era))]
    for (const era of [...eras].reverse()) {
      fireEvent.click(toc.getByRole('button', { name: era }))
      const first = NORMATIVE_OUTLINE.findIndex((step) => step.era === era)
      expect(stepIndex()).toBe(first)
    }
  })
})

describe('boundaries and controls', () => {
  it('prev and next clamp at the ends and disable at the boundary', () => {
    render(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" initialMode="browse" />)
    const prev = document.querySelector('[data-presentation-prev]') as HTMLButtonElement
    const next = document.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(stepIndex()).toBe(1)
    fireEvent.click(prev)
    fireEvent.click(prev)
    expect(stepIndex()).toBe(0)
  })
})

describe('sample traversal through controls', () => {
  it('walks every sample step forward and backward with exact captions and indices', () => {
    render(<Presentation steps={SAMPLE_STEPS} title="Deck" initialMode="browse" />)
    const caption = () => document.querySelector('[data-presentation-caption]')?.textContent
    NORMATIVE_OUTLINE.forEach((step, index) => {
      expect(stepIndex()).toBe(index)
      expect(caption()).toBe(step.caption)
      expect(caption()?.length).toBeGreaterThan(0)
      if (index < NORMATIVE_OUTLINE.length - 1) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    })
    for (let index = NORMATIVE_OUTLINE.length - 2; index >= 0; index -= 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
      expect(stepIndex()).toBe(index)
      expect(caption()).toBe(NORMATIVE_OUTLINE[index].caption)
    }
  })
})

describe('host branding and attribution', () => {
  it('renders no default and-scene brand in the header slot', () => {
    render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode="browse" />)
    const brand = document.querySelector('[data-presentation-brand]') as HTMLElement
    expect(brand.textContent).toBe('')
    expect(brand.querySelector('a')).toBeNull()
  })

  it('renders a host-supplied brand inside the header slot only', () => {
    render(
      <Presentation steps={makeSteps(['a'])} title="Deck" initialMode="browse" brand={<a href="/home">Host Co</a>} />,
    )
    const brand = document.querySelector('[data-presentation-brand]') as HTMLElement
    expect(within(brand).getByRole('link', { name: 'Host Co' })).toBeTruthy()
    expect(document.querySelectorAll('[data-presentation-attribution]')).toHaveLength(1)
  })

  it('renders the attribution link with its exact text, href, hook, and bottom-right anchoring', () => {
    render(<Presentation steps={makeSteps(['a'])} title="Deck" />)
    const link = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.style.position).toBe('absolute')
    expect(link.style.right).toBe('12px')
    expect(link.style.bottom).toBe('8px')
  })

  it('omits the attribution only when the presentation opts out', () => {
    render(<Presentation steps={makeSteps(['a'])} title="Deck" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('fit independence from step content', () => {
  it('gives the same canvas transform for short and long captions in the same viewport and mode', () => {
    vi.stubGlobal('innerWidth', 1280)
    vi.stubGlobal('innerHeight', 720)
    const short = makeSteps(['a', 'b'])
    const long = makeSteps(['a', 'b']).map((step) => ({ ...step, caption: 'word '.repeat(300) }))
    const first = render(<Presentation steps={short} title="Deck" initialMode="browse" />)
    const shortTransform = (document.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform
    first.unmount()
    render(<Presentation steps={long} title="Deck" initialMode="browse" />)
    expect((document.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform).toBe(shortTransform)
  })
})
