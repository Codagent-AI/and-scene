import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { makeSteps } from './helpers'
import type { Mode } from '../types'

afterEach(cleanup)

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const index = () => Number(root().getAttribute('data-step-index'))
const key = (k: string, target: Element | Window = window) => fireEvent.keyDown(target, { key: k })

function setup(opts: { n?: number; mode?: Mode; eras?: string[] } = {}) {
  const steps = makeSteps(opts.n ?? 5, opts.eras)
  return render(<Presentation steps={steps} title="Deck" initialMode={opts.mode} />)
}

describe('chrome modes', () => {
  it('present mode shows marker and one-line title but hides caption, ToC, and prev/next', () => {
    setup({ mode: 'present' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(document.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Title 1' })).toBeTruthy()
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-nav]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
  })

  it('browse mode shows title, caption, ToC (wide), prev/next, and progress indicators', () => {
    window.innerWidth = 1400
    setup({ mode: 'browse' })
    expect(screen.getByRole('heading', { name: 'Title 1' })).toBeTruthy()
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 1')
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-nav]')).toHaveLength(2)
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(5)
  })

  it('hides the ToC on narrow viewports in browse mode', () => {
    window.innerWidth = 600
    setup({ mode: 'browse' })
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).not.toBeNull()
  })

  it('defaults to browse and honours initialMode', () => {
    setup()
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    cleanup()
    setup({ mode: 'present' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
  })

  it('toggling the mode keeps the current step', () => {
    setup({ mode: 'browse' })
    key('ArrowRight')
    key('ArrowRight')
    expect(index()).toBe(2)
    fireEvent.click(document.querySelector('[data-presentation-mode-toggle]')!)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe(2)
    key('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe(2)
  })
})

describe('navigation', () => {
  it('advances on Right, Space, PageDown and goes back on Left, PageUp', () => {
    setup()
    for (const k of ['ArrowRight', ' ', 'PageDown']) key(k)
    expect(index()).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) key(k)
    expect(index()).toBe(1)
  })

  it('clamps at both ends', () => {
    setup({ n: 3 })
    key('ArrowLeft')
    expect(index()).toBe(0)
    for (let i = 0; i < 6; i++) key('ArrowRight')
    expect(index()).toBe(2)
    expect((document.querySelector('[data-presentation-nav="next"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('swipes: left advances, right goes back', () => {
    setup()
    const swipe = (dx: number) => {
      fireEvent.touchStart(document.body, { touches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchEnd(document.body, { changedTouches: [{ clientX: 300 + dx, clientY: 104 }] })
    }
    swipe(-150)
    expect(index()).toBe(1)
    swipe(150)
    expect(index()).toBe(0)
  })

  it('jumps via progress indicators and ToC entries (first step of the era)', () => {
    window.innerWidth = 1400
    setup({ n: 5 })
    fireEvent.click(screen.getByRole('button', { name: /Step 4:/ }))
    expect(index()).toBe(3)
    const toc = within(document.querySelector('[data-presentation-toc]') as HTMLElement)
    fireEvent.click(toc.getByRole('button', { name: 'era b' }))
    expect(index()).toBe(2)
    fireEvent.click(toc.getByRole('button', { name: 'era a' }))
    expect(index()).toBe(0)
  })

  it('exposes aria-current and an active hook on the current progress item and ToC entry', () => {
    window.innerWidth = 1400
    setup({ n: 5 })
    key('ArrowRight')
    key('ArrowRight')
    const items = [...document.querySelectorAll('[data-presentation-progress-item]')]
    expect(items.map((i) => i.getAttribute('aria-current'))).toEqual([null, null, 'step', null, null])
    expect(items.map((i) => i.getAttribute('data-presentation-active'))).toEqual(['false', 'false', 'true', 'false', 'false'])
    const tocItems = [...document.querySelectorAll('[data-presentation-toc-item]')]
    expect(tocItems.map((i) => i.getAttribute('aria-current'))).toEqual([null, 'step'])
    expect(tocItems.map((i) => i.getAttribute('data-presentation-active'))).toEqual(['false', 'true'])
  })

  it('lets a focused control keep its navigation keys', () => {
    setup()
    const button = document.querySelector('[data-presentation-mode-toggle]') as HTMLElement
    button.focus()
    key('ArrowRight', button)
    key(' ', button)
    key('PageDown', button)
    expect(index()).toBe(0)
    const dot = document.querySelectorAll('[data-presentation-progress-item]')[0]
    key('ArrowRight', dot)
    expect(index()).toBe(0)
  })

  it('lets a focused ARIA slider keep its arrow keys', () => {
    setup()
    const slider = document.createElement('div')
    slider.setAttribute('role', 'slider')
    slider.tabIndex = 0
    document.body.appendChild(slider)
    key('ArrowRight', slider)
    key('PageDown', slider)
    expect(index()).toBe(0)
    slider.remove()
  })

  it('ignores keys combined with modifiers', () => {
    setup()
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(index()).toBe(0)
  })
})

describe('hooks and attribution', () => {
  it('exposes step count, index, and id hooks on the root', () => {
    setup({ n: 4 })
    expect(root().getAttribute('data-step-count')).toBe('4')
    key('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('1')
    expect(root().getAttribute('data-step-id')).toBe('s2')
  })

  it('shows the default attribution bottom-right with a styling hook', () => {
    setup()
    const link = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.href).toBe('https://github.com/and-scene/and-scene')
    expect(link.style.position).toBe('fixed')
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
  })

  it('has no default top-left brand, but renders a host-provided one', () => {
    setup()
    const slot = document.querySelector('[data-presentation-brand-slot]') as HTMLElement
    expect(slot.querySelector('a')).toBeNull()
    expect(slot.textContent).toBe('')
    cleanup()
    render(<Presentation steps={makeSteps(2)} brand={<a href="/">host</a>} />)
    expect(document.querySelector('[data-presentation-brand-slot] a')?.textContent).toBe('host')
  })

  it('lets the host override or drop the attribution', () => {
    render(<Presentation steps={makeSteps(2)} attribution={{ label: 'custom', href: '/x' }} />)
    expect(document.querySelector('[data-presentation-attribution]')?.textContent).toBe('custom')
    cleanup()
    render(<Presentation steps={makeSteps(2)} attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('renders the default 880 x 380 canvas', () => {
    setup()
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
  })
})
