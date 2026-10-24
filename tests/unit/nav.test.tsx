// @vitest-environment jsdom
import { StrictMode, type ReactNode } from 'react'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit/index.ts'

const strict = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
const key = (k: string, target: Element = document.body, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key: k, ...init })

function setup(count = 5, mode?: 'browse' | 'present') {
  return renderHook(() => usePresentationNav(count, mode), { wrapper: strict })
}

function goto(result: { current: ReturnType<typeof usePresentationNav> }, i: number) {
  act(() => result.current.goTo(i))
}

describe('keyboard navigation (M-20, C-03)', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (k) => {
    const { result } = setup()
    goto(result, 2)
    key(k)
    expect(result.current.index).toBe(3)
  })

  it.each(['ArrowLeft', 'PageUp'])('%j goes back exactly one step', (k) => {
    const { result } = setup()
    goto(result, 2)
    key(k)
    expect(result.current.index).toBe(1)
  })

  it('prevents default only for handled keys and ignores modified or unrelated keys', () => {
    const { result } = setup()
    expect(key('ArrowRight')).toBe(false)
    expect(key('x')).toBe(true)
    expect(key('ArrowRight', document.body, { ctrlKey: true })).toBe(true)
    expect(key('ArrowRight', document.body, { metaKey: true })).toBe(true)
    expect(result.current.index).toBe(1)
  })

  it('a single key press under StrictMode produces a single change, and unmount cleans up', () => {
    const { result, unmount } = setup()
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['keydown', 'touchstart', 'touchend']))
    key('ArrowRight')
    expect(result.current.index).toBe(1)
  })
})

describe('boundaries (M-25)', () => {
  it('clamps at the start and the end with keys and actions, without wrapping', () => {
    const { result } = setup(3)
    key('ArrowLeft')
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    goto(result, 2)
    key('ArrowRight')
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    goto(result, 99)
    expect(result.current.index).toBe(2)
    goto(result, -4)
    expect(result.current.index).toBe(0)
  })

  it('treats a single-step deck as both boundaries', () => {
    const { result } = setup(1)
    key('ArrowRight')
    key('ArrowLeft')
    expect(result.current.index).toBe(0)
  })
})

describe('touch (M-21)', () => {
  const swipe = (dx: number, dy = 0) => {
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 200, clientY: 200 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] })
  }

  it('left swipe advances and right swipe goes back, once per gesture', () => {
    const { result } = setup()
    goto(result, 2)
    swipe(-120)
    expect(result.current.index).toBe(3)
    swipe(120)
    expect(result.current.index).toBe(2)
  })

  it('does nothing for tiny or vertical gestures', () => {
    const { result } = setup()
    goto(result, 2)
    swipe(-10)
    swipe(-100, 160)
    expect(result.current.index).toBe(2)
  })
})

describe('mode (M-19)', () => {
  it('honours initialMode, defaults to browse, and toggles with the P key and the action', () => {
    const initial = setup(3, 'present')
    expect(initial.result.current.mode).toBe('present')
    initial.unmount()
    const { result } = setup(3)
    expect(result.current.mode).toBe('browse')
    goto(result, 1)
    key('p')
    expect(result.current.mode).toBe('present')
    key('P')
    expect(result.current.mode).toBe('browse')
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
  })
})

describe('focused controls keep their keys (M-24)', () => {
  const controls: [string, () => HTMLElement][] = [
    ['button', () => Object.assign(document.createElement('button'), { textContent: 'x' })],
    ['link', () => Object.assign(document.createElement('a'), { href: '/x', textContent: 'x' })],
    ['input', () => document.createElement('input')],
    ['select', () => document.createElement('select')],
    ['textarea', () => document.createElement('textarea')],
    [
      'contenteditable',
      () => {
        const el = document.createElement('div')
        el.setAttribute('contenteditable', 'true')
        el.innerHTML = '<span>q</span>'
        return el
      },
    ],
  ]

  it.each(controls)('%s and its descendants do not move the deck or lose default behaviour', (_name, make) => {
    const { result } = setup()
    goto(result, 2)
    const el = make()
    document.body.append(el)
    const targets = [el, ...Array.from(el.children)] as HTMLElement[]
    for (const target of targets) {
      for (const k of ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'Enter', 'p']) {
        expect(key(k, target), `${k} on ${target.tagName}`).toBe(true)
      }
    }
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
    el.remove()
  })

  it('lets a control-owned handler run for the same key', () => {
    const { result } = setup()
    const button = document.createElement('button')
    const own = vi.fn()
    button.addEventListener('keydown', own)
    document.body.append(button)
    key(' ', button)
    expect(own).toHaveBeenCalledTimes(1)
    expect(result.current.index).toBe(0)
    button.remove()
  })

  it('does not double-handle a key another handler already consumed', () => {
    const { result } = setup()
    const consume = (e: KeyboardEvent) => e.preventDefault()
    document.body.addEventListener('keydown', consume)
    key('ArrowRight')
    document.body.removeEventListener('keydown', consume)
    expect(result.current.index).toBe(0)
  })
})
