import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'

afterEach(cleanup)

let mounts = 0
interface Payload {
  n: number
}
function Grouped({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts++
  }, [])
  return <div data-testid="grouped">{payload.n}</div>
}
function Solo({ stepIndex }: SceneProps) {
  return <div data-testid="solo">{stepIndex}</div>
}

// Compile-checked: a strongly typed payload array is accepted without casts.
const typed: Step<Payload>[] = [1, 2].map((n) => ({
  id: `g${n}`, era: 'One', title: `G${n}`, caption: `cap g${n}`, scene: Grouped, payload: { n }, groupKey: 'g',
}))
const steps = [
  ...typed,
  { id: 's', era: 'Two', title: 'Solo', caption: 'cap solo', scene: Solo, payload: undefined },
]

const root = (c: HTMLElement) => c.querySelector('[data-presentation-chrome]')!
const press = (key: string) => act(() => void fireEvent.keyDown(window, { key }))

describe('<Presentation>', () => {
  it('exposes hooks and clamps navigation', () => {
    const { container } = render(<Presentation steps={steps} title="T" />)
    const el = root(container)
    expect(el.getAttribute('data-step-count')).toBe('3')
    expect(el.getAttribute('data-step-index')).toBe('0')
    press('ArrowLeft')
    expect(el.getAttribute('data-step-index')).toBe('0')
    press('ArrowRight')
    press(' ')
    press('PageDown')
    press('ArrowRight')
    expect(el.getAttribute('data-step-index')).toBe('2')
    press('PageUp')
    expect(el.getAttribute('data-step-index')).toBe('1')
  })

  it('toggles mode preserving index; chrome per mode', () => {
    const { container } = render(<Presentation steps={steps} title="T" />)
    const el = root(container)
    press('ArrowRight')
    expect(el.getAttribute('data-presentation-mode')).toBe('present')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('G2')
    for (const h of ['caption', 'prev', 'next', 'progress', 'toc']) {
      expect(container.querySelector(`[data-presentation-${h}]`)).toBeNull()
    }
    press('p')
    expect(el.getAttribute('data-presentation-mode')).toBe('browse')
    expect(el.getAttribute('data-step-index')).toBe('1')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('cap g2')
    expect(container.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(3)
  })

  it('honors initialMode and shows ToC on wide viewports only', () => {
    const { container } = render(<Presentation steps={steps} title="T" initialMode="browse" />)
    expect(root(container).getAttribute('data-presentation-mode')).toBe('browse')
    expect(container.querySelector('[data-presentation-toc]')).toBeNull() // jsdom is 1024 wide
    cleanup()
    window.innerWidth = 1400
    const wide = render(<Presentation steps={steps} title="T" initialMode="browse" />)
    expect(wide.container.querySelectorAll('[data-presentation-toc-entry]')).toHaveLength(2)
    window.innerWidth = 1024
  })

  it('jumps via progress and ToC with active-state attributes', () => {
    window.innerWidth = 1400
    const { container } = render(<Presentation steps={steps} title="T" initialMode="browse" />)
    const items = () => [...container.querySelectorAll('[data-presentation-progress-item]')]
    fireEvent.click(items()[2])
    expect(root(container).getAttribute('data-step-index')).toBe('2')
    expect(items()[2].getAttribute('aria-current')).toBe('step')
    expect(items()[2].getAttribute('data-presentation-active')).toBe('true')
    expect(items()[0].hasAttribute('aria-current')).toBe(false)
    expect(items()[0].getAttribute('data-presentation-active')).not.toBe('true')
    const toc = [...container.querySelectorAll('[data-presentation-toc-entry]')]
    expect(toc[1].getAttribute('aria-current')).toBe('step')
    expect(toc[0].hasAttribute('aria-current')).toBe(false)
    fireEvent.click(toc[0])
    expect(root(container).getAttribute('data-step-index')).toBe('0')
    window.innerWidth = 1024
  })

  it('does not hijack keys from focused controls', () => {
    const { container } = render(<Presentation steps={steps} title="T" initialMode="browse" />)
    const btn = container.querySelector('[data-presentation-progress-item="0"]') as HTMLElement
    act(() => void fireEvent.keyDown(btn, { key: 'ArrowRight' }))
    expect(root(container).getAttribute('data-step-index')).toBe('0')
  })

  it('handles swipes', () => {
    const { container } = render(<Presentation steps={steps} title="T" />)
    const swipe = (dx: number) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: 200, clientY: 100 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 100 }] })
    }
    swipe(-100)
    expect(root(container).getAttribute('data-step-index')).toBe('1')
    swipe(100)
    expect(root(container).getAttribute('data-step-index')).toBe('0')
  })

  it('keeps the grouped scene mounted across grouped steps', () => {
    mounts = 0
    const { container, getByTestId } = render(<Presentation steps={steps} title="T" />)
    const node = getByTestId('grouped')
    press('ArrowRight')
    expect(getByTestId('grouped')).toBe(node)
    expect(node.textContent).toBe('2')
    expect(mounts).toBeLessThanOrEqual(2) // StrictMode double-invokes effects once
    expect(container.querySelectorAll('[data-testid="grouped"]')).toHaveLength(1)
  })

  it('derives step numbers from position', () => {
    const { container } = render(<Presentation steps={steps} title="T" />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01')
    cleanup()
    const reordered = [steps[2], steps[0], steps[1]]
    const r = render(<Presentation steps={reordered} title="T" />)
    expect(r.container.querySelector('[data-presentation-title]')?.textContent).toBe('Solo')
    expect(r.container.querySelector('[data-presentation-marker]')?.textContent).toBe('01')
  })

  it('shows default attribution, supports override/disable, and no top-left brand', () => {
    const a = render(<Presentation steps={steps} title="T" />)
    const link = a.container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(a.container.querySelector('header [href]')).toBeNull()
    expect(a.container.querySelector('[data-presentation-brand-slot]')?.childNodes).toHaveLength(0)
    cleanup()
    const b = render(<Presentation steps={steps} title="T" attribution={{ label: 'x', href: 'https://e.test' }} />)
    expect(b.container.querySelector('[data-presentation-attribution]')?.textContent).toBe('x')
    cleanup()
    const c = render(<Presentation steps={steps} title="T" attribution={false} />)
    expect(c.container.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})
