// @vitest-environment jsdom
import { StrictMode, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { key, swipe, touchEndOnly } from '../../tests/helpers/events.ts'
import { swipeDirection, usePresentationNav } from './usePresentationNav.ts'

const setup = (count = 6, mode?: 'present' | 'browse', wrapper?: ({ children }: { children: ReactNode }) => ReactNode) =>
  renderHook(() => usePresentationNav(count, mode), { wrapper })

function atIndex(index: number, count = 6) {
  const hook = setup(count)
  act(() => hook.result.current.goTo(index))
  return hook
}

describe('keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (k) => {
    const { result } = atIndex(3)
    key(document.body, k)
    expect(result.current.index).toBe(4)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (k) => {
    const { result } = atIndex(3)
    key(document.body, k)
    expect(result.current.index).toBe(2)
  })

  it('ignores unrelated keys', () => {
    const { result } = atIndex(3)
    const event = key(document.body, 'x')
    expect(result.current.index).toBe(3)
    expect(event.defaultPrevented).toBe(false)
  })

  it('advances once per key under StrictMode and after a rerender', () => {
    const { result, rerender } = setup(6, 'browse', ({ children }) => <StrictMode>{children}</StrictMode>)
    rerender()
    key(document.body, 'ArrowRight')
    expect(result.current.index).toBe(1)
    rerender()
    key(document.body, 'ArrowRight')
    expect(result.current.index).toBe(2)
  })

  it('removes every listener it added when unmounted', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = setup()
    const added = add.mock.calls.length
    unmount()
    expect(remove.mock.calls.length).toBe(added)
    key(document.body, 'ArrowRight')
    expect(result.current.index).toBe(0)
    add.mockRestore()
    remove.mockRestore()
  })
})

describe('mode', () => {
  it.each(['present', 'browse'] as const)('opens in the declared %s mode', (mode) => {
    expect(setup(6, mode).result.current.mode).toBe(mode)
  })

  it('P toggles the mode and keeps the current step', () => {
    const { result } = atIndex(3)
    key(document.body, 'p')
    expect(result.current).toMatchObject({ mode: 'present', index: 3 })
    key(document.body, 'P')
    expect(result.current).toMatchObject({ mode: 'browse', index: 3 })
  })
})

describe('touch swipe', () => {
  it('swiping left advances and swiping right goes back at the 50px threshold', () => {
    const { result } = atIndex(3)
    swipe(-50)
    expect(result.current.index).toBe(4)
    swipe(50)
    expect(result.current.index).toBe(3)
  })

  it.each([
    ['below the threshold', -49, 0],
    ['vertical dominance', -80, 100],
    ['equal horizontal and vertical travel', -60, 60],
  ])('does nothing for %s', (_name, dx, dy) => {
    const { result } = atIndex(3)
    swipe(dx, dy)
    expect(result.current.index).toBe(3)
  })

  it('does not reuse stale start coordinates', () => {
    const { result } = atIndex(3)
    swipe(-60)
    touchEndOnly(0, 100)
    expect(result.current.index).toBe(4)
  })

  it('classifies swipes in the pure helper', () => {
    expect(swipeDirection(-50, 49)).toBe(1)
    expect(swipeDirection(50, 0)).toBe(-1)
    expect(swipeDirection(49, 0)).toBe(0)
  })
})

describe('controls keep their keys', () => {
  const interactive: [string, () => HTMLElement][] = [
    ['button', () => document.createElement('button')],
    ['link', () => Object.assign(document.createElement('a'), { href: 'https://example.com' })],
    ['input', () => document.createElement('input')],
    ['select', () => document.createElement('select')],
    ['textarea', () => document.createElement('textarea')],
    ['summary', () => document.createElement('summary')],
    ['contenteditable', () => Object.assign(document.createElement('div'), { contentEditable: 'true' })],
    ['aria slider', () => Object.assign(document.createElement('div'), { role: 'slider' })],
  ]

  it.each(interactive)('does not navigate from a focused %s', (_name, make) => {
    const { result } = atIndex(3)
    const el = make()
    if (_name === 'contenteditable') el.setAttribute('contenteditable', 'true')
    document.body.append(el)
    for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) key(el, k)
    expect(result.current).toMatchObject({ index: 3, mode: 'browse' })
    el.remove()
  })

  it('does not navigate from a descendant of an interactive control', () => {
    const { result } = atIndex(3)
    const button = document.createElement('button')
    const icon = document.createElement('span')
    button.append(icon)
    document.body.append(button)
    key(icon, 'ArrowRight')
    expect(result.current.index).toBe(3)
    button.remove()
  })

  it('leaves the key to the control instead of preventing it', () => {
    atIndex(3)
    const input = document.createElement('input')
    document.body.append(input)
    expect(key(input, ' ').defaultPrevented).toBe(false)
    input.remove()
  })

  it.each([['ctrlKey'], ['metaKey'], ['altKey']])('ignores %s combinations', (modifier) => {
    const { result } = atIndex(3)
    key(document.body, 'ArrowRight', { [modifier]: true })
    expect(result.current.index).toBe(3)
  })

  it('ignores events another handler already handled', () => {
    const { result } = atIndex(3)
    const handler = (event: Event) => event.preventDefault()
    document.body.addEventListener('keydown', handler)
    key(document.body, 'ArrowRight')
    document.body.removeEventListener('keydown', handler)
    expect(result.current.index).toBe(3)
  })

  it('still navigates from ordinary content (positive control)', () => {
    const { result } = atIndex(3)
    const div = document.createElement('div')
    document.body.append(div)
    key(div, 'ArrowRight')
    expect(result.current.index).toBe(4)
    div.remove()
  })
})

describe('boundaries', () => {
  it('clamps keys and swipes at both ends', () => {
    const { result } = setup(3)
    key(document.body, 'ArrowLeft')
    swipe(60)
    expect(result.current.index).toBe(0)
    for (let i = 0; i < 6; i++) key(document.body, 'ArrowRight')
    swipe(-60)
    expect(result.current.index).toBe(2)
  })

  it('clamps direct jumps and works for a one-step presentation', () => {
    const { result } = setup(1)
    key(document.body, 'ArrowRight')
    act(() => result.current.goTo(9))
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(-3))
    expect(result.current.index).toBe(0)
  })
})
