import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'

beforeAll(() => {
  window.matchMedia = ((q: string) => ({
    matches: true,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})
afterEach(cleanup)

let mounts = 0
interface Payload {
  n: number
}
function Counter({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts++
  }, [])
  return <div data-testid="scene">scene {payload.n}</div>
}
const grouped = (id: string, era: string, n: number): Step<Payload> => ({
  id,
  era,
  title: `Title ${id}`,
  caption: `Caption ${id}`,
  Scene: Counter,
  groupKey: 'g',
  payload: { n },
})
const steps = [grouped('a', 'one', 1), grouped('b', 'one', 2), grouped('c', 'two', 3), grouped('d', 'two', 4)]

const index = () => document.querySelector('[data-step-index]')!.getAttribute('data-step-index')
const press = (key: string) => act(() => void fireEvent.keyDown(window, { key }))

function setup(initialMode: 'browse' | 'present' = 'browse') {
  mounts = 0
  return render(<Presentation steps={steps} title="T" initialMode={initialMode} />)
}

describe('Presentation', () => {
  it('exposes step count and index hooks', () => {
    setup()
    expect(document.querySelector('[data-step-count]')!.getAttribute('data-step-count')).toBe('4')
    expect(index()).toBe('0')
  })

  it('navigates by keyboard and clamps at both ends', () => {
    setup()
    press('ArrowLeft')
    expect(index()).toBe('0')
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(index()).toBe('3')
    press('ArrowRight')
    expect(index()).toBe('3')
    press('PageUp')
    press('ArrowLeft')
    expect(index()).toBe('1')
  })

  it('does not hijack keys while a control has focus', () => {
    setup()
    const next = document.querySelector<HTMLElement>('[data-presentation-next]')!
    next.focus()
    act(() => void fireEvent.keyDown(next, { key: 'ArrowRight' }))
    expect(index()).toBe('0')
  })

  it('swipes left to advance and right to go back', () => {
    setup()
    const root = document.querySelector('[data-presentation-root]')!
    const swipe = (from: number, to: number) => {
      act(() => void fireEvent.touchStart(root, { touches: [{ clientX: from, clientY: 100 }] }))
      act(() => void fireEvent.touchEnd(root, { changedTouches: [{ clientX: to, clientY: 100 }] }))
    }
    swipe(300, 100)
    expect(index()).toBe('1')
    swipe(100, 300)
    expect(index()).toBe('0')
  })

  it('toggles mode with P and keeps the step; present hides caption, toc and controls', () => {
    setup()
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    press('p')
    expect(index()).toBe('1')
    expect(document.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('present')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe('Title b')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('2 / 4')
  })

  it('honours initialMode', () => {
    setup('present')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
  })

  it('jumps via progress dots and toc entries with semantic current state', () => {
    setup()
    const dots = document.querySelectorAll<HTMLElement>('[data-presentation-dot]')
    fireEvent.click(dots[2])
    expect(index()).toBe('2')
    const cur = document.querySelectorAll('[data-presentation-dot][aria-current="step"]')
    expect(cur).toHaveLength(1)
    expect(cur[0]).toBe(dots[2])
    expect(dots[2].getAttribute('data-active')).toBe('true')
    const toc = document.querySelectorAll<HTMLElement>('[data-presentation-toc-entry]')
    expect(toc[1].getAttribute('aria-current')).toBe('step')
    fireEvent.click(toc[0])
    expect(index()).toBe('0')
    fireEvent.click(toc[1])
    expect(index()).toBe('2')
  })

  it('keeps one scene instance across grouped steps, only changing the payload', () => {
    setup()
    expect(mounts).toBe(1)
    press('ArrowRight')
    press('ArrowRight')
    expect(mounts).toBe(1)
    expect(screen.getByTestId('scene').textContent).toBe('scene 3')
  })

  it('shows the default bottom-right attribution and no default brand', () => {
    setup()
    const a = document.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(a.style.right).toBe('0px')
    expect(a.style.bottom).toBe('0px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('lets hosts add a brand or drop the attribution', () => {
    render(<Presentation steps={steps} title="T" brand={<span>host</span>} attribution={null} />)
    expect(document.querySelector('[data-presentation-brand]')!.textContent).toBe('host')
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('derives step numbers from position after reordering', () => {
    const reordered = [steps[2], steps[0], steps[1]]
    render(<Presentation steps={reordered} title="T" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('1 / 3')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('2 / 3')
  })
})
