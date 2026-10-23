import { act, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { SWIPE_THRESHOLD } from '../../src/presentation-kit/constants'
import { classifySwipe, clampIndex, usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { key, makeSteps, setViewport, stepIndex, swipe } from './helpers'

const setup = (count = 5, mode: 'browse' | 'present' = 'browse') => renderHook(() => usePresentationNav(count, mode))
const step = (r: ReturnType<typeof setup>, k: string, n = 1) => {
  for (let i = 0; i < n; i++) key(k)
  return r.result.current.index
}

describe('keyboard navigation (L-21, I-12)', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%j advances exactly one step', (k) => {
    const r = setup()
    step(r, 'ArrowRight', 2)
    expect(step(r, k)).toBe(3)
  })
  it.each([['ArrowLeft'], ['PageUp']])('%s goes back exactly one step', (k) => {
    const r = setup()
    step(r, 'ArrowRight', 3)
    expect(step(r, k)).toBe(2)
  })
  it('prevents browser scrolling for handled keys and ignores others', () => {
    setup()
    const e = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    act(() => void window.dispatchEvent(e))
    expect(e.defaultPrevented).toBe(true)
    const other = new KeyboardEvent('keydown', { key: 'x', cancelable: true })
    act(() => void window.dispatchEvent(other))
    expect(other.defaultPrevented).toBe(false)
  })
  it('ignores modified shortcuts', () => {
    const r = setup()
    key('ArrowRight', window, { ctrlKey: true })
    expect(r.result.current.index).toBe(0)
  })
})

describe('boundaries (L-26, L-27, I-17)', () => {
  it('clamps at the start for prev, Left, PageUp and right swipe', () => {
    const r = setup()
    act(() => r.result.current.prev())
    key('ArrowLeft')
    key('PageUp')
    swipe(120)
    expect(r.result.current.index).toBe(0)
  })
  it('clamps at the end for next, Right, Space, PageDown and left swipe', () => {
    const r = setup(3)
    step(r, 'ArrowRight', 5)
    expect(r.result.current.index).toBe(2)
    act(() => r.result.current.next())
    key(' ')
    key('PageDown')
    swipe(-120)
    expect(r.result.current.index).toBe(2)
  })
  it('handles a one-step deck at both ends', () => {
    const r = setup(1)
    key('ArrowRight')
    key('ArrowLeft')
    swipe(-100)
    swipe(100)
    expect(r.result.current.index).toBe(0)
    expect(clampIndex(5, 0)).toBe(0)
  })
  it('never wraps when jumping out of range', () => {
    const r = setup(3)
    act(() => r.result.current.goTo(99))
    expect(r.result.current.index).toBe(2)
    act(() => r.result.current.goTo(-4))
    expect(r.result.current.index).toBe(0)
  })
})

describe('touch swipe (L-22, I-13)', () => {
  it('left swipe advances and right swipe goes back by one', () => {
    const r = setup()
    swipe(-100)
    expect(r.result.current.index).toBe(1)
    swipe(100)
    expect(r.result.current.index).toBe(0)
  })
  it('ignores short, vertical-dominant and cancelled gestures', () => {
    const r = setup()
    swipe(-(SWIPE_THRESHOLD - 5))
    swipe(-100, 200)
    expect(r.result.current.index).toBe(0)
    const start = new Event('touchstart')
    Object.assign(start, { touches: [{ clientX: 300, clientY: 300 }] })
    act(() => void window.dispatchEvent(start))
    act(() => void window.dispatchEvent(new Event('touchcancel')))
    const end = new Event('touchend')
    Object.assign(end, { changedTouches: [{ clientX: 100, clientY: 300 }] })
    act(() => void window.dispatchEvent(end))
    expect(r.result.current.index).toBe(0)
  })
  it('classifies by threshold and horizontal dominance', () => {
    expect(classifySwipe(-SWIPE_THRESHOLD, 0)).toBe('next')
    expect(classifySwipe(SWIPE_THRESHOLD, 0)).toBe('prev')
    expect(classifySwipe(-SWIPE_THRESHOLD, SWIPE_THRESHOLD)).toBeNull()
  })
})

describe('focused controls keep their keys (L-25, I-16)', () => {
  const cases: [string, () => HTMLElement][] = [
    ['button', () => document.createElement('button')],
    ['input', () => document.createElement('input')],
    ['select', () => document.createElement('select')],
    ['textarea', () => document.createElement('textarea')],
    ['link', () => Object.assign(document.createElement('a'), { href: '#x' })],
    ['editable', () => {
      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      return div
    }],
    ['nested in button', () => document.createElement('button')],
  ]
  it.each(cases)('does not move the deck from a %s', (name, make) => {
    const r = setup()
    const el = make()
    if (name === 'nested in button') el.appendChild(document.createElement('span'))
    document.body.appendChild(el)
    const target = name === 'nested in button' ? (el.firstChild as Element) : el
    const e = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    act(() => void target.dispatchEvent(e))
    expect(r.result.current.index).toBe(0)
    expect(e.defaultPrevented).toBe(false)
    el.remove()
  })
  it('still navigates from non-interactive targets', () => {
    const r = setup()
    const div = document.body.appendChild(document.createElement('div'))
    key('ArrowRight', div)
    expect(r.result.current.index).toBe(1)
    div.remove()
  })
})

describe('mode switching (L-19, I-11)', () => {
  it.each([['browse', 'present'], ['present', 'browse']] as const)('starts in %s and P toggles to %s', (from, to) => {
    const r = setup(3, from)
    expect(r.result.current.mode).toBe(from)
    key('p')
    expect(r.result.current.mode).toBe(to)
    key('P')
    expect(r.result.current.mode).toBe(from)
  })
  it('keeps the active step when toggling', () => {
    const r = setup()
    step(r, 'ArrowRight', 2)
    key('p')
    expect(r.result.current.index).toBe(2)
  })
})

describe('StrictMode and listener cleanup (C-3)', () => {
  it('moves one step per event under StrictMode', () => {
    setViewport(1024)
    const { container } = render(<StrictMode><Presentation steps={makeSteps()} title="t" /></StrictMode>)
    key('ArrowRight')
    expect(stepIndex(container)).toBe(1)
  })
  it('removes every listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => usePresentationNav(3))
    const added = add.mock.calls.filter(([t]) => ['keydown', 'touchstart', 'touchend', 'touchcancel'].includes(String(t)))
    unmount()
    for (const [type, fn] of added) expect(remove.mock.calls.some(([t, f]) => t === type && f === fn)).toBe(true)
    add.mockRestore()
    remove.mockRestore()
  })
})
