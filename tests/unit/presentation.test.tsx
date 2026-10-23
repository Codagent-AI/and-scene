import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps, mounts, touch } from './helpers'

const q = (sel: string) => document.querySelector(sel)
const qa = (sel: string) => [...document.querySelectorAll(sel)]
const root = () => q('[data-presentation-root]')!

beforeEach(() => {
  mounts.length = 0
  Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
})

describe('Presentation chrome', () => {
  it('browse mode shows title, caption, ToC, progress and prev/next (I-18)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    expect(q('[data-presentation-title]')?.textContent).toBe('Deck')
    expect(q('[data-presentation-step-title]')?.textContent).toBe('Title a')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption a')
    expect(q('[data-presentation-toc]')).not.toBeNull()
    expect(qa('[data-presentation-dot]')).toHaveLength(4)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(q('[data-presentation-marker]')?.textContent).toContain('1 / 4')
  })

  it('hides the ToC on narrow viewports (I-18)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(qa('[data-presentation-dot]')).toHaveLength(4)
  })

  it('present mode shows only marker and one-line title (I-17)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-marker]')).not.toBeNull()
    expect(q('[data-presentation-step-title]')?.textContent).toBe('Title a')
    for (const hidden of ['caption', 'toc', 'prev', 'next', 'dot', 'title']) {
      expect(q(`[data-presentation-${hidden}]`)).toBeNull()
    }
  })

  it('toggling the mode keeps the current step (I-19)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(root().getAttribute('data-step-index')).toBe('2')
  })

  it('exposes step count and index hooks that follow navigation (I-61)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(root().getAttribute('data-step-count')).toBe('4')
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.click(q('[data-presentation-next]')!)
    expect(root().getAttribute('data-step-index')).toBe('1')
    fireEvent.click(q('[data-presentation-prev]')!)
    expect(root().getAttribute('data-step-index')).toBe('0')
  })

  it('every step shows a caption and next/previous work, with ends disabled (I-51)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const prev = q('[data-presentation-prev]') as HTMLButtonElement
    const next = q('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    for (const id of ['a', 'b', 'c', 'd']) {
      expect(q('[data-presentation-caption]')?.textContent).toBe(`Caption ${id}`)
      if (id !== 'd') fireEvent.click(next)
    }
    expect(next.disabled).toBe(true)
  })

  it('progress dots and ToC entries jump; ToC goes to the first step of the era (I-22)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    fireEvent.click(qa('[data-presentation-dot]')[3])
    expect(root().getAttribute('data-step-index')).toBe('3')
    fireEvent.click(qa('[data-presentation-toc-item]')[0])
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.click(qa('[data-presentation-toc-item]')[1])
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(qa('[data-presentation-toc-item]').map((e) => e.textContent)).toEqual(['one', 'two'])
  })

  it('marks only the active dot and ToC entry with aria-current and a hook (I-23)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    fireEvent.click(qa('[data-presentation-dot]')[2])
    const dots = qa('[data-presentation-dot]')
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.hasAttribute('data-presentation-active'))).toEqual([false, false, true, false])
    const toc = qa('[data-presentation-toc-item]')
    expect(toc.map((d) => d.getAttribute('aria-current'))).toEqual([null, 'step'])
    expect(toc.map((d) => d.hasAttribute('data-presentation-active'))).toEqual([false, true])
  })

  it('pressing keys on a focused control does not also advance the deck (I-24)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const dot = qa('[data-presentation-dot]')[0] as HTMLElement
    dot.focus()
    fireEvent.keyDown(dot, { key: 'ArrowRight' })
    fireEvent.keyDown(dot, { key: ' ' })
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(root().getAttribute('data-step-index')).toBe('1')
  })

  it('swipes through the rendered deck (I-21)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    act(() => { touch('touchstart', 400); touch('touchend', 100) })
    expect(root().getAttribute('data-step-index')).toBe('1')
    act(() => { touch('touchstart', 100); touch('touchend', 400) })
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows a bottom-right "made by and-scene" link to the repository with a hook (I-14, I-15)', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.style.right).not.toBe('')
    expect(link.style.bottom).not.toBe('')
    expect(link.style.left).toBe('')
  })

  it('can be overridden or omitted', () => {
    const { rerender } = render(
      <Presentation steps={makeSteps()} title="Deck" attribution={{ label: 'x', href: 'https://example.com' }} />,
    )
    expect(screen.getByRole('link', { name: 'x' }).getAttribute('href')).toBe('https://example.com')
    rerender(<Presentation steps={makeSteps()} title="Deck" attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand; a host brand fills the slot (I-16)', () => {
    const { unmount } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q('[data-presentation-brand-slot]')?.childNodes).toHaveLength(0)
    expect(within(q('[data-presentation-header]') as HTMLElement).queryByRole('link')).toBeNull()
    unmount()
    render(<Presentation steps={makeSteps()} title="Deck" brand={<span>Acme</span>} />)
    expect(q('[data-presentation-brand-slot]')?.textContent).toBe('Acme')
  })
})

describe('scene hosting', () => {
  it('keeps one scene instance across grouped steps and only changes the payload (I-7)', async () => {
    render(<Presentation steps={makeSteps(true)} title="Deck" />)
    expect(screen.getByTestId('scene').textContent).toBe('scene 0')
    fireEvent.click(q('[data-presentation-next]')!)
    fireEvent.click(q('[data-presentation-next]')!)
    await waitFor(() => expect(screen.getByTestId('scene').textContent).toBe('scene 2'), { timeout: 5000 })
    expect(mounts).toHaveLength(1)
    expect(qa('[data-presentation-scene]')).toHaveLength(1)
  })

  it('replaces the scene when steps are not grouped, exiting the old one (I-6)', async () => {
    render(<Presentation steps={makeSteps(false)} title="Deck" />)
    expect(screen.getByTestId('scene')).toBeTruthy()
    fireEvent.click(q('[data-presentation-next]')!)
    await waitFor(() => expect(screen.getByTestId('other')).toBeTruthy(), { timeout: 5000 })
    await waitFor(() => expect(screen.queryByTestId('scene')).toBeNull(), { timeout: 5000 })
  })

  it('renders the canvas at the default 880 x 380 and a custom size on request (I-27)', () => {
    const { unmount } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const canvas = q('[data-presentation-canvas]') as HTMLElement
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
    unmount()
    render(<Presentation steps={makeSteps()} title="Deck" designWidth={600} designHeight={300} />)
    const custom = q('[data-presentation-canvas]') as HTMLElement
    expect([custom.style.width, custom.style.height]).toEqual(['600px', '300px'])
  })
})
