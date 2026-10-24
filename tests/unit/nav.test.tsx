// @vitest-environment jsdom
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clampIndex, isInteractiveTarget, swipeDirection, usePresentationNav } from '../../src/presentation-kit/usePresentationNav'

const key = (k: string, init: KeyboardEventInit = {}, target: Document | Element = document.body) =>
  fireEvent.keyDown(target, { key: k, ...init })

const setup = (count = 5, extra: Partial<Parameters<typeof usePresentationNav>[0]> = {}) =>
  renderHook(() => usePresentationNav({ count, ...extra }))

describe('keyboard navigation', () => {
  it.each(['ArrowRight', 'PageDown', ' '])('%j advances exactly one step', (k) => {
    const { result } = setup()
    key(k)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (k) => {
    const { result } = setup(5, { initialIndex: 3 })
    key(k)
    expect(result.current.index).toBe(2)
  })

  it('prevents page scrolling on Space', () => {
    setup()
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    document.body.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('does not double-handle after unmount (listeners are cleaned up)', () => {
    const { result, unmount } = setup()
    unmount()
    key('ArrowRight')
    expect(result.current.index).toBe(0)
  })

  it('a single mounted hook advances once per key press', () => {
    const { result } = setup()
    key('ArrowRight')
    key('ArrowRight')
    expect(result.current.index).toBe(2)
  })
})

describe('boundaries', () => {
  it('clamps at the first step', () => {
    const { result } = setup()
    key('ArrowLeft')
    act(() => result.current.prev())
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('clamps at the last step', () => {
    const { result } = setup(3)
    act(() => result.current.goTo(2))
    key('ArrowRight')
    act(() => result.current.next())
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
  })

  it('clampIndex handles empty decks', () => {
    expect(clampIndex(3, 0)).toBe(0)
  })
})

describe('swipe', () => {
  const swipe = (dx: number, dy = 0) => {
    fireEvent.touchStart(window, { touches: [{ clientX: 200, clientY: 200 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] })
  }

  it('swiping left advances and right goes back, one step each', () => {
    const { result } = setup(5, { initialIndex: 2 })
    swipe(-80)
    expect(result.current.index).toBe(3)
    swipe(80)
    expect(result.current.index).toBe(2)
  })

  it('needs at least 50px of horizontal travel', () => {
    const { result } = setup()
    swipe(-49)
    expect(result.current.index).toBe(0)
    swipe(-50)
    expect(result.current.index).toBe(1)
  })

  it('ignores vertical-dominant and equal-axis gestures', () => {
    const { result } = setup()
    swipe(-60, 90)
    swipe(-60, 60)
    swipe(60, -60)
    expect(result.current.index).toBe(0)
  })

  it('swipeDirection maps direction by sign', () => {
    expect(swipeDirection(-100, 0)).toBe('next')
    expect(swipeDirection(100, 0)).toBe('prev')
    expect(swipeDirection(10, 0)).toBeNull()
  })
})

describe('mode', () => {
  it('honours initialMode and toggles with P (either case) while keeping the step', () => {
    const { result } = setup(5, { initialMode: 'browse', initialIndex: 2 })
    expect(result.current.mode).toBe('browse')
    key('p')
    expect(result.current.mode).toBe('present')
    key('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('defaults to present mode', () => {
    expect(setup().result.current.mode).toBe('present')
  })
})

describe('controls keep their keys', () => {
  const makers: Record<string, () => HTMLElement> = {
    button: () => document.createElement('button'),
    link: () => Object.assign(document.createElement('a'), { href: '#x' }),
    input: () => document.createElement('input'),
    select: () => document.createElement('select'),
    textarea: () => document.createElement('textarea'),
    summary: () => document.createElement('summary'),
    contenteditable: () => {
      const el = document.createElement('div')
      el.setAttribute('contenteditable', 'true')
      return el
    },
    'role=button': () => {
      const el = document.createElement('div')
      el.setAttribute('role', 'button')
      return el
    },
    'role=slider': () => {
      const el = document.createElement('div')
      el.setAttribute('role', 'slider')
      return el
    },
    'nested descendant': () => {
      const outer = document.createElement('button')
      const inner = document.createElement('span')
      outer.appendChild(inner)
      document.body.appendChild(outer)
      return inner
    },
  }

  for (const [name, make] of Object.entries(makers)) {
    it(`ignores every navigation key from a focused ${name}`, () => {
      const { result } = setup(5, { initialIndex: 2 })
      const el = make()
      if (!el.isConnected) document.body.appendChild(el)
      expect(isInteractiveTarget(el)).toBe(true)
      for (const k of ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'p']) {
        const event = new KeyboardEvent('keydown', { key: k, cancelable: true, bubbles: true })
        el.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      }
      expect(result.current.index).toBe(2)
      expect(result.current.mode).toBe('present')
      el.remove()
    })
  }

  it('navigates from body and document focus', () => {
    const { result } = setup()
    key('ArrowRight', {}, document.body)
    key('ArrowRight', {}, document)
    expect(result.current.index).toBe(2)
  })

  it('treats contenteditable="false" and plain divs as non-interactive', () => {
    const el = document.createElement('div')
    el.setAttribute('contenteditable', 'false')
    expect(isInteractiveTarget(el)).toBe(false)
    expect(isInteractiveTarget(document.createElement('div'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)('ignores keys combined with %s', (modifier) => {
    const { result } = setup()
    key('ArrowRight', { [modifier]: true })
    key('p', { [modifier]: true })
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
  })
})
