import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

function Scene({ payload }: SceneProps<string>) {
  return <div data-testid="scene">{payload}</div>
}

const ERAS = ['Setup', 'Setup', 'Build', 'Build', 'Build', 'Ship']

const steps: Step<string>[] = ERAS.map((era, i) => ({
  id: `s${i}`,
  era,
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  groupKey: 'g',
  Scene,
  payload: `payload-${i}`,
}))

function setViewport(width: number, height = 900) {
  window.innerWidth = width
  window.innerHeight = height
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function root(): HTMLElement {
  return document.querySelector('[data-presentation-root]') as HTMLElement
}

function progress(i: number): HTMLButtonElement {
  return document.querySelector(`[data-presentation-progress-index="${i}"]`) as HTMLButtonElement
}

function tocItem(firstIndex: number): HTMLButtonElement {
  return document.querySelector(`[data-presentation-toc-index="${firstIndex}"]`) as HTMLButtonElement
}

function activeHooks(): Element[] {
  return Array.from(document.querySelectorAll('[data-presentation-active="true"]'))
}

beforeEach(() => {
  setViewport(1280)
})

afterEach(() => {
  cleanup()
})

describe('L-15: direct jumps from progress and ToC', () => {
  it('L-15: a non-adjacent progress control jumps to its step and renders its payload', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    fireEvent.click(progress(4))
    expect(root().dataset.stepIndex).toBe('4')
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-4')
    fireEvent.click(progress(0))
    expect(root().dataset.stepIndex).toBe('0')
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-0')
  })

  it('L-15: a ToC entry jumps to the first step of its era, even from a later step within that era', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    fireEvent.click(progress(4))
    expect(root().dataset.stepIndex).toBe('4')
    fireEvent.click(tocItem(2))
    expect(root().dataset.stepIndex).toBe('2')
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-2')
    fireEvent.click(tocItem(5))
    expect(root().dataset.stepIndex).toBe('5')
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-5')
    fireEvent.click(tocItem(0))
    expect(root().dataset.stepIndex).toBe('0')
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-0')
  })
})

describe('L-16: active navigation state', () => {
  it('L-16: initially exactly one progress and one ToC item carry the active hook and semantic current state', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const active = activeHooks()
    expect(active).toHaveLength(2)
    expect(progress(0).getAttribute('data-presentation-active')).toBe('true')
    expect(progress(0).getAttribute('aria-current')).toBe('step')
    for (let i = 1; i < steps.length; i++) {
      expect(progress(i).hasAttribute('data-presentation-active')).toBe(false)
      expect(progress(i).hasAttribute('aria-current')).toBe(false)
    }
    expect(tocItem(0).getAttribute('data-presentation-active')).toBe('true')
    expect(tocItem(0).getAttribute('aria-current')).toBe('location')
    expect(tocItem(2).hasAttribute('data-presentation-active')).toBe(false)
    expect(tocItem(2).hasAttribute('aria-current')).toBe(false)
    expect(tocItem(5).hasAttribute('aria-current')).toBe(false)
  })

  it('L-16: navigating within and across eras moves the current state to the correct controls', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(progress(1).getAttribute('aria-current')).toBe('step')
    expect(progress(0).hasAttribute('aria-current')).toBe(false)
    expect(tocItem(0).getAttribute('data-presentation-active')).toBe('true')

    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(progress(2).getAttribute('aria-current')).toBe('step')
    expect(progress(1).hasAttribute('aria-current')).toBe(false)
    expect(tocItem(2).getAttribute('data-presentation-active')).toBe('true')
    expect(tocItem(2).getAttribute('aria-current')).toBe('location')
    expect(tocItem(0).hasAttribute('data-presentation-active')).toBe(false)
    expect(tocItem(0).hasAttribute('aria-current')).toBe(false)

    fireEvent.click(progress(5))
    expect(progress(5).getAttribute('aria-current')).toBe('step')
    expect(progress(2).hasAttribute('aria-current')).toBe(false)
    expect(tocItem(5).getAttribute('data-presentation-active')).toBe('true')
    expect(tocItem(2).hasAttribute('data-presentation-active')).toBe(false)
    expect(activeHooks()).toHaveLength(2)
  })
})

describe('L-21: chrome root step count and index hooks', () => {
  function expectHooks(count: number, index: number) {
    expect(root().dataset.stepCount).toBe(String(count))
    expect(root().dataset.stepIndex).toBe(String(index))
    expect(root().dataset.presentationStepCount).toBe(String(count))
    expect(root().dataset.presentationStepIndex).toBe(String(index))
  }

  it('L-21: all four attributes are set on the chrome root initially', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expectHooks(6, 0)
    expect(root().getAttribute('data-step-count')).toBe('6')
    expect(root().getAttribute('data-presentation-step-index')).toBe('0')
  })

  it('L-21: both alias pairs track forward/back navigation and direct jumps and agree with the payload', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expectHooks(6, 2)
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-2')
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expectHooks(6, 1)
    fireEvent.click(progress(5))
    expectHooks(6, 5)
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-5')
  })

  it('L-21: changing the step count updates all four hooks, and the index is clamped to the new last step', () => {
    const { rerender } = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    fireEvent.click(progress(5))
    expectHooks(6, 5)
    rerender(<Presentation steps={steps.slice(0, 3)} title="Deck" initialMode="browse" />)
    expectHooks(3, 2)
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-2')
  })
})
