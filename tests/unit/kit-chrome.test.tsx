import type { ReactElement } from 'react'
import { act, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation, type Step } from '../../src/presentation-kit'
import { setViewport, restoreViewport } from './kit-viewport'

function Blank(): ReactElement {
  return <div />
}

const ERAS: Array<[string, string]> = [
  ['a', 'Intro'],
  ['b', 'Intro'],
  ['c', 'Middle'],
  ['d', 'Middle'],
  ['e', 'End'],
]

function makeSteps(entries: Array<[string, string]> = ERAS): Step[] {
  return entries.map(([id, era]) => ({
    id,
    era,
    title: `Title ${id.toUpperCase()}`,
    caption: `Caption for ${id}`,
    Scene: Blank,
  }))
}

function key(k: string) {
  fireEvent.keyDown(document.body, { key: k })
}

function root(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-presentation-root]') as HTMLElement
}

function progressItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-presentation-progress-item]'))
}

function tocItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-presentation-toc-item]'))
}

function stepIndex(container: HTMLElement): number {
  return Number(root(container).dataset.presentationStepIndex)
}

function eraOf(index: number): string {
  return ERAS[index]![1]
}

/** Asserts exactly the current progress dot and era entry carry the active semantics. */
function assertActiveState(container: HTMLElement, index: number) {
  progressItems(container).forEach((dot, i) => {
    if (i === index) {
      expect(dot.getAttribute('aria-current')).toBe('step')
      expect(dot.dataset.presentationActive).toBe('true')
    } else {
      expect(dot.hasAttribute('aria-current'), `progress ${i} aria-current`).toBe(false)
      expect(dot.hasAttribute('data-presentation-active'), `progress ${i} active hook`).toBe(false)
    }
  })
  const expectedEra = eraOf(index)
  tocItems(container).forEach((entry) => {
    const active = entry.textContent === expectedEra
    if (active) {
      expect(entry.getAttribute('aria-current')).toBe('step')
      expect(entry.dataset.presentationActive).toBe('true')
    } else {
      expect(entry.hasAttribute('aria-current'), `toc ${entry.textContent} aria-current`).toBe(false)
      expect(entry.hasAttribute('data-presentation-active'), `toc ${entry.textContent} active hook`).toBe(false)
    }
  })
}

beforeEach(() => {
  act(() => setViewport(1280, 800))
})

afterEach(() => {
  act(() => restoreViewport())
})

describe('I-18 browse mode chrome and ToC threshold', () => {
  it('shows active title, multi-line caption, previous/next, progress, mode toggle, and the ToC on wide viewports', () => {
    const { container, getByRole } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title A')
    const caption = container.querySelector<HTMLElement>('[data-presentation-caption]')
    expect(caption?.textContent).toBe('Caption for a')
    expect(caption?.style.whiteSpace).toBe('normal')
    expect(getByRole('button', { name: 'Previous' })).toBeTruthy()
    expect(getByRole('button', { name: 'Next' })).toBeTruthy()
    expect(getByRole('button', { name: 'Present' })).toBeTruthy()
    expect(progressItems(container)).toHaveLength(5)
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it.each([
    [1280, true],
    [1440, true],
    [1024, true],
    [1023, false],
    [800, false],
    [390, false],
  ])('at %i px wide the ToC is shown: %s', (width, shown) => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    act(() => setViewport(width, 844))
    expect(container.querySelector('[data-presentation-toc]') !== null).toBe(shown)
  })

  it('reacts to resize events in both directions', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    act(() => setViewport(800, 800))
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    act(() => setViewport(1024, 800))
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })
})

describe('I-17 present mode is title-focused', () => {
  it('shows only the marker and single-line title, and hides caption, ToC, and previous/next controls', () => {
    const { container, queryByRole } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(root(container).dataset.presentationMode).toBe('present')
    expect(container.querySelector('[data-presentation-caption]')).toBeNull()
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(queryByRole('button', { name: 'Next' })).toBeNull()
    expect(progressItems(container)).toHaveLength(0)

    key('ArrowRight')
    key('ArrowRight')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('3')
    const title = container.querySelector<HTMLElement>('[data-presentation-title]')
    expect(title?.textContent).toBe('Title C')
    expect(title?.style.whiteSpace).toBe('nowrap')
    expect(title?.style.overflow).toBe('hidden')
    expect(title?.style.textOverflow).toBe('ellipsis')
    expect(container.querySelector('[data-presentation-caption]')).toBeNull()
  })

  it('hides the ToC even on a wide viewport', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
  })
})

describe('I-19 initial mode and mode toggle preserve position', () => {
  it('starts in browse by default and honors initialMode="present"', () => {
    const browse = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(root(browse.container).dataset.presentationMode).toBe('browse')
    browse.unmount()
    const present = render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(root(present.container).dataset.presentationMode).toBe('present')
  })

  it('P toggles modes from a middle step in both directions and keeps the step id, index, and payload', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    expect(stepIndex(container)).toBe(2)
    key('p')
    expect(root(container).dataset.presentationMode).toBe('present')
    expect(container.querySelector('[data-presentation-caption]')).toBeNull()
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title C')
    expect(stepIndex(container)).toBe(2)
    key('P')
    expect(root(container).dataset.presentationMode).toBe('browse')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption for c')
    expect(stepIndex(container)).toBe(2)
  })

  it('toggles from the present-mode start as well', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    key('P')
    expect(root(container).dataset.presentationMode).toBe('browse')
    expect(stepIndex(container)).toBe(3)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title D')
  })
})

describe('I-22 direct jump', () => {
  it('progress activation jumps to that exact step', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    fireEvent.click(progressItems(container)[4]!)
    expect(stepIndex(container)).toBe(4)
    fireEvent.click(progressItems(container)[1]!)
    expect(stepIndex(container)).toBe(1)
    fireEvent.click(progressItems(container)[3]!)
    expect(stepIndex(container)).toBe(3)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title D')
  })

  it('ToC activation jumps to the first step of its era, including when the era is already active on a later step', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const toc = container.querySelector<HTMLElement>('[data-presentation-toc]')!
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    expect(stepIndex(container)).toBe(3)
    fireEvent.click(within(toc).getByRole('button', { name: 'Middle' }))
    expect(stepIndex(container)).toBe(2)
    fireEvent.click(within(toc).getByRole('button', { name: 'End' }))
    expect(stepIndex(container)).toBe(4)
    fireEvent.click(within(toc).getByRole('button', { name: 'Intro' }))
    expect(stepIndex(container)).toBe(0)
    key('ArrowRight')
    expect(stepIndex(container)).toBe(1)
    fireEvent.click(within(toc).getByRole('button', { name: 'Intro' }))
    expect(stepIndex(container)).toBe(0)
  })
})

describe('I-23 active navigation state is exposed', () => {
  it('exposes exactly one current progress dot and era entry across next, back, direct jumps, and keys', () => {
    const { container, getByRole } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const toc = container.querySelector<HTMLElement>('[data-presentation-toc]')!
    assertActiveState(container, 0)

    fireEvent.click(getByRole('button', { name: 'Next' }))
    assertActiveState(container, 1)
    fireEvent.click(getByRole('button', { name: 'Next' }))
    assertActiveState(container, 2)

    fireEvent.click(progressItems(container)[0]!)
    assertActiveState(container, 0)

    fireEvent.click(within(toc).getByRole('button', { name: 'End' }))
    assertActiveState(container, 4)

    key('ArrowLeft')
    assertActiveState(container, 3)

    fireEvent.click(getByRole('button', { name: 'Previous' }))
    assertActiveState(container, 2)

    fireEvent.click(within(toc).getByRole('button', { name: 'Intro' }))
    assertActiveState(container, 0)
  })
})

describe('I-25 on-screen controls clamp at both ends', () => {
  it('previous on the first step is inert and does not wrap', () => {
    const { container, getByRole } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const prev = getByRole('button', { name: 'Previous' })
    expect(prev.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(prev)
    fireEvent.click(prev)
    expect(stepIndex(container)).toBe(0)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title A')
  })

  it('next on the last step is inert and does not wrap', () => {
    const { container, getByRole } = render(<Presentation steps={makeSteps()} title="Deck" />)
    fireEvent.click(progressItems(container)[4]!)
    const next = getByRole('button', { name: 'Next' })
    expect(next.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(next)
    fireEvent.click(next)
    expect(stepIndex(container)).toBe(4)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title E')
  })
})

describe('I-28 verification hooks on the chrome root', () => {
  function expectHooks(container: HTMLElement, count: number, index: number) {
    const r = root(container)
    expect(r.dataset.stepCount).toBe(String(count))
    expect(r.dataset.stepIndex).toBe(String(index))
    expect(r.dataset.presentationStepCount).toBe(String(count))
    expect(r.dataset.presentationStepIndex).toBe(String(index))
  }

  it('exposes the design-named and namespaced pairs with identical values through navigation', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expectHooks(container, 5, 0)
    key('ArrowRight')
    expectHooks(container, 5, 1)
    fireEvent.click(progressItems(container)[3]!)
    expectHooks(container, 5, 3)
    key('p')
    expectHooks(container, 5, 3)
    key('P')
    expectHooks(container, 5, 3)
    key('ArrowLeft')
    expectHooks(container, 5, 2)
  })

  it('follows insertion and reordering of the step input', () => {
    const base = makeSteps()
    const { container, rerender } = render(<Presentation steps={base} title="Deck" />)
    fireEvent.click(progressItems(container)[2]!)
    expectHooks(container, 5, 2)

    const inserted = makeSteps([['z', 'Intro'], ...ERAS])
    rerender(<Presentation steps={inserted} title="Deck" />)
    expectHooks(container, 6, 2)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe(`Title ${inserted[2]!.id.toUpperCase()}`)

    const reversed = [...inserted].reverse()
    rerender(<Presentation steps={reversed} title="Deck" />)
    expectHooks(container, 6, 2)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe(`Title ${reversed[2]!.id.toUpperCase()}`)
  })
})
