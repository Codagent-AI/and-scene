import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps, mounts } from './fixtures'

const steps = makeSteps(['one', 'one', 'two', 'three'])
const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const press = (key: string) => act(() => void fireEvent.keyDown(window, { key }))

beforeEach(() => {
  mounts.count = 0
  mounts.unmounts = 0
  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
})

describe('step model and numbering', () => {
  it('shows an order-derived marker and exposes step hooks', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(root().dataset.stepCount).toBe('4')
    expect(root().dataset.stepIndex).toBe('0')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('01')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('02')
  })

  it('renumbers when steps are reordered, with no manual numbering', () => {
    const reordered = [steps[3], steps[0]]
    render(<Presentation steps={reordered} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('01')
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe('Title 3')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('02')
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe('Title 0')
  })
})

describe('present and browse modes', () => {
  it('present mode shows marker and title only', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(root().dataset.presentationMode).toBe('present')
    expect(document.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe('Title 0')
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) {
      expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    }
  })

  it('browse mode shows title, caption, toc, controls and progress on wide viewports', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe('Title 0')
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 0')
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
  })

  it('hides the table of contents on narrow viewports', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true })
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).not.toBeNull()
  })

  it('opens in the declared mode and toggling keeps the step', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    fireEvent.click(document.querySelector('[data-presentation-mode-toggle]')!)
    expect(root().dataset.presentationMode).toBe('present')
    expect(root().dataset.stepIndex).toBe('2')
    press('p')
    expect(root().dataset.presentationMode).toBe('browse')
    expect(root().dataset.stepIndex).toBe('2')
  })
})

describe('direct jumps and active semantics', () => {
  it('jumps from a progress indicator and exposes aria-current on the active one only', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const items = document.querySelectorAll<HTMLElement>('[data-presentation-progress-item]')
    fireEvent.click(items[3])
    expect(root().dataset.stepIndex).toBe('3')
    const after = document.querySelectorAll<HTMLElement>('[data-presentation-progress-item]')
    expect([...after].map((el) => el.getAttribute('aria-current'))).toEqual([null, null, null, 'step'])
    expect([...after].map((el) => el.hasAttribute('data-presentation-active'))).toEqual([false, false, false, true])
  })

  it('jumps to the first step of a table-of-contents era and marks the active entry', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const toc = within(document.querySelector<HTMLElement>('[data-presentation-toc]')!)
    fireEvent.click(toc.getByRole('button', { name: 'two' }))
    expect(root().dataset.stepIndex).toBe('2')
    fireEvent.click(toc.getByRole('button', { name: 'one' }))
    expect(root().dataset.stepIndex).toBe('0')
    const active = document.querySelectorAll('[data-presentation-toc-item][aria-current="step"]')
    expect(active).toHaveLength(1)
    expect(active[0].textContent).toBe('one')
    expect(active[0].hasAttribute('data-presentation-active')).toBe(true)
  })

  it('moves with the on-screen controls and disables them at the ends', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const prev = document.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    expect(prev.disabled).toBe(true)
    fireEvent.click(document.querySelector('[data-presentation-next]')!)
    expect(root().dataset.stepIndex).toBe('1')
    expect(prev.disabled).toBe(false)
  })

  it('does not advance when a control has focus and a navigation key is pressed', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const dot = document.querySelectorAll<HTMLElement>('[data-presentation-progress-item]')[1]
    dot.focus()
    act(() => void fireEvent.keyDown(dot, { key: 'ArrowRight' }))
    act(() => void fireEvent.keyDown(dot, { key: ' ' }))
    expect(root().dataset.stepIndex).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows the default attribution with a hook', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toMatch(/^https:\/\/github\.com\/.*and-scene/)
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(getComputedStyle(link).right).toBe('0px')
    expect(getComputedStyle(link).bottom).toBe('0px')
  })

  it('has no default top-left brand link', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const header = document.querySelector('[data-presentation-header]')!
    expect(header.querySelector('a')).toBeNull()
    expect(header.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('renders a host-provided brand and attribution override', () => {
    render(
      <Presentation
        steps={steps}
        title="Deck"
        brand={<a href="/">host</a>}
        attribution={{ label: 'custom', href: 'https://example.com' }}
      />,
    )
    expect(screen.getByRole('link', { name: 'host' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'custom' }).getAttribute('href')).toBe('https://example.com')
  })
})

describe('grouped scenes', () => {
  it('keeps one scene instance across steps that share a group key', async () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(mounts.count).toBe(1)
    press('ArrowRight')
    press('ArrowRight')
    await waitFor(() => expect(root().dataset.stepIndex).toBe('2'))
    expect(mounts.count).toBe(1)
    expect(mounts.unmounts).toBe(0)
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })

  it('remounts when the group key changes', async () => {
    const ungrouped = makeSteps(['a', 'b'], false)
    render(<Presentation steps={ungrouped} title="Deck" initialMode="present" />)
    press('ArrowRight')
    await waitFor(() => expect(mounts.count).toBe(2))
  })

  it('shows the canvas at the default 880 x 380 design size', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
  })
})
