import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ATTRIBUTION_URL } from './constants'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

let mounts = 0
interface P {
  n: number
}
function Grouped({ payload }: SceneProps<P>) {
  useEffect(() => {
    mounts++
  }, [])
  return <div data-testid="grouped">{payload.n}</div>
}
function Other() {
  return <div data-testid="other" />
}

const base = { caption: 'cap' }
const steps: Step<P>[] = [
  { id: 'a', era: 'One', title: 'T-a', ...base, Scene: Grouped, groupKey: 'g', payload: { n: 1 } },
  { id: 'b', era: 'One', title: 'T-b', ...base, Scene: Grouped, groupKey: 'g', payload: { n: 2 } },
  { id: 'c', era: 'Two', title: 'T-c', ...base, Scene: Grouped, groupKey: 'g', payload: { n: 3 } },
  { id: 'd', era: 'Three', title: 'T-d', ...base, Scene: Other as Step<P>['Scene'] },
]

const root = (c: HTMLElement) => c.querySelector('[data-presentation-root]') as HTMLElement
const idx = (c: HTMLElement) => root(c).getAttribute('data-step-index')
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

beforeEach(() => {
  mounts = 0
  window.innerWidth = 1400
})
afterEach(cleanup)

describe('Presentation', () => {
  it('accepts typed step arrays without casts and exposes counts', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(root(container).getAttribute('data-step-count')).toBe('4')
    expect(idx(container)).toBe('0')
  })

  it('navigates by keyboard and clamps', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    key('ArrowLeft')
    expect(idx(container)).toBe('0')
    key('ArrowRight')
    key(' ')
    key('PageDown')
    key('ArrowRight')
    expect(idx(container)).toBe('3')
    key('PageUp')
    expect(idx(container)).toBe('2')
  })

  it('does not hijack keys from focused controls', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const btn = container.querySelector('[data-presentation-mode-toggle]') as HTMLElement
    act(() => void fireEvent.keyDown(btn, { key: 'ArrowRight' }))
    expect(idx(container)).toBe('0')
  })

  it('keeps the grouped scene instance across steps and updates payload', () => {
    const { container, getByTestId } = render(<Presentation steps={steps} title="Deck" />)
    expect(getByTestId('grouped').textContent).toBe('1')
    key('ArrowRight')
    key('ArrowRight')
    expect(mounts).toBe(1)
    expect(getByTestId('grouped').textContent).toBe('3')
    expect(container.querySelectorAll('[data-testid="grouped"]').length).toBe(1)
  })

  it('shows default attribution with hook and no brand', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const a = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(ATTRIBUTION_URL).toBe(a.href)
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('allows overriding attribution', () => {
    const { container } = render(
      <Presentation steps={steps} title="Deck" attribution={{ label: 'x', href: 'https://e.test/' }} />,
    )
    const a = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('x')
    expect(a.href).toBe('https://e.test/')
  })

  it('renders browse and present chrome and toggles mode on the same step', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    key('ArrowRight')
    expect(root(container).getAttribute('data-presentation-mode')).toBe('browse')
    expect(container.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-progress-item]').length).toBe(4)
    key('p')
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(idx(container)).toBe('1')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('T-b')
    for (const sel of ['caption', 'toc', 'next', 'prev', 'progress']) {
      expect(container.querySelector(`[data-presentation-${sel}]`)).toBeNull()
    }
  })

  it('hides the ToC on narrow viewports', () => {
    window.innerWidth = 600
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('exposes active state on progress and ToC items and jumps', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const progress = () => [...container.querySelectorAll('[data-presentation-progress-item]')]
    fireEvent.click(progress()[1])
    expect(idx(container)).toBe('1')
    const active = container.querySelectorAll('[data-presentation-progress-item][data-presentation-active="true"]')
    expect(active.length).toBe(1)
    expect(active[0]).toBe(progress()[1])
    expect(progress()[1].getAttribute('aria-current')).toBe('step')
    expect(progress()[0].getAttribute('aria-current')).toBeNull()

    const toc = [...container.querySelectorAll('[data-presentation-toc-item]')]
    expect(toc[0].getAttribute('aria-current')).toBe('true')
    expect(toc[0].getAttribute('data-presentation-active')).toBe('true')
    expect(toc[1].getAttribute('data-presentation-active')).toBeNull()
    fireEvent.click(toc[1])
    expect(idx(container)).toBe('2')
    fireEvent.click(toc[0])
    expect(idx(container)).toBe('0')
  })

  it('swipes left to advance and right to go back', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const swipe = (dx: number) => {
      act(() => {
        fireEvent.touchStart(window, { touches: [{ clientX: 200, clientY: 100 }] })
        fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 100 }] })
      })
    }
    swipe(-150)
    expect(idx(container)).toBe('1')
    swipe(150)
    expect(idx(container)).toBe('0')
  })
})
