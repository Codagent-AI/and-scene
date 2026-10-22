import { act, cleanup, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SWIPE_THRESHOLD } from '../constants.ts'
import { swipeAction, usePresentationNav } from '../usePresentationNav.ts'
import { key, swipe, touch } from './helpers.ts'

afterEach(cleanup)

const setup = (count = 5, initialMode?: 'present' | 'browse') =>
  renderHook(() => usePresentationNav({ count, initialMode }))

describe('keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (name) => {
    const { result } = setup()
    key(name)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (name) => {
    const { result } = setup()
    act(() => result.current.goTo(3))
    key(name)
    expect(result.current.index).toBe(2)
  })

  it('removes its listeners on unmount so a remount never double-advances', () => {
    const first = setup()
    first.unmount()
    const second = setup()
    key('ArrowRight')
    expect(first.result.current.index).toBe(0)
    expect(second.result.current.index).toBe(1)
  })

  it('responds once per key under StrictMode (no stale subscriptions)', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 5 }), { wrapper: StrictMode })
    key('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  it('ignores modifier chords and unrelated keys', () => {
    const { result } = setup()
    key('ArrowRight', document.body, { ctrlKey: true })
    key('x')
    expect(result.current.index).toBe(0)
  })
})

describe('mode toggle', () => {
  it.each(['present', 'browse'] as const)('honors initialMode %s and toggles with P in both directions', (initial) => {
    const { result } = setup(5, initial)
    expect(result.current.mode).toBe(initial)
    act(() => result.current.goTo(2))
    key('p')
    expect(result.current.mode).toBe(initial === 'present' ? 'browse' : 'present')
    expect(result.current.index).toBe(2)
    key('P')
    expect(result.current.mode).toBe(initial)
    expect(result.current.index).toBe(2)
  })

  it('defaults to present mode', () => {
    expect(setup().result.current.mode).toBe('present')
  })
})

describe('touch swipe', () => {
  it('advances on a left swipe and goes back on a right swipe', () => {
    const { result } = setup()
    swipe(-120)
    expect(result.current.index).toBe(1)
    swipe(120)
    expect(result.current.index).toBe(0)
  })

  it('ignores short and mostly vertical movements', () => {
    const { result } = setup()
    swipe(-(SWIPE_THRESHOLD - 1))
    swipe(-100, 200)
    expect(result.current.index).toBe(0)
  })

  it('ignores a touchend with no matching touchstart', () => {
    const { result } = setup()
    touch('touchend', 0, 0)
    expect(result.current.index).toBe(0)
  })

  it('classifies swipes at the threshold', () => {
    expect(swipeAction(-SWIPE_THRESHOLD, 0)).toBe('next')
    expect(swipeAction(SWIPE_THRESHOLD, 0)).toBe('prev')
    expect(swipeAction(SWIPE_THRESHOLD - 1, 0)).toBeNull()
  })
})

describe('controls keep their keys', () => {
  function withControl(tag: string, attrs: Record<string, string> = {}) {
    const el = document.createElement(tag)
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
    const child = document.createElement('span')
    el.appendChild(child)
    document.body.appendChild(el)
    return { el, child }
  }
  const cases: [string, string, Record<string, string>?][] = [
    ['button', 'button'],
    ['link', 'a', { href: '#x' }],
    ['input', 'input'],
    ['textarea', 'textarea'],
    ['select', 'select'],
    ['contenteditable', 'div', { contenteditable: 'true' }],
    ['aria role', 'div', { role: 'slider' }],
  ]

  it.each(cases)('leaves navigation keys to a focused %s (and its children)', (_name, tag, attrs) => {
    const { result } = setup()
    const { el, child } = withControl(tag, attrs)
    const heard = vi.fn()
    el.addEventListener('keydown', heard)
    for (const target of [el, child]) {
      for (const name of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp']) {
        const event = key(name, target)
        expect(event.defaultPrevented).toBe(false)
      }
    }
    expect(result.current.index).toBe(0)
    expect(heard).toHaveBeenCalledTimes(10)
    el.remove()
  })

  it('lets P through outside text entry but not inside it', () => {
    const { result } = setup()
    const { el: button } = withControl('button')
    key('p', button)
    expect(result.current.mode).toBe('browse')
    const { el: input } = withControl('input')
    key('p', input)
    expect(result.current.mode).toBe('browse')
    button.remove()
    input.remove()
  })
})

describe('boundaries', () => {
  it('clamps at the start and the end for every input', () => {
    const { result } = setup(3)
    key('ArrowLeft')
    key('PageUp')
    swipe(120)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(2))
    key('ArrowRight')
    key(' ')
    swipe(-120)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('still moves away from each boundary', () => {
    const { result } = setup(3)
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    key('ArrowLeft')
    expect(result.current.index).toBe(0)
  })

  it('tolerates an empty and a single-step deck', () => {
    const empty = setup(0)
    key('ArrowRight')
    expect(empty.result.current.index).toBe(0)
    const single = setup(1)
    key('ArrowRight')
    expect(single.result.current.index).toBe(0)
  })
})

describe('StrictMode mounting', () => {
  it('works inside a rendered tree under StrictMode', () => {
    function Probe() {
      const nav = usePresentationNav({ count: 3 })
      return <output data-testid="i">{nav.index}</output>
    }
    const { getByTestId } = render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    )
    key('ArrowRight')
    expect(getByTestId('i').textContent).toBe('1')
  })
})
