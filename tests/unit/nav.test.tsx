import { StrictMode } from 'react'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isInteractiveTarget, swipeDirection, usePresentationNav } from '../../src/presentation-kit'

const key = (k: string, target: EventTarget = document.body) => {
  fireEvent.keyDown(target, { key: k })
}

function touch(startX: number, startY: number, endX: number, endY: number) {
  fireEvent.touchStart(window, { changedTouches: [{ clientX: startX, clientY: startY }] })
  fireEvent.touchEnd(window, { changedTouches: [{ clientX: endX, clientY: endY }] })
}

const setup = (count = 5, mode: 'browse' | 'present' = 'browse') => renderHook(() => usePresentationNav(count, mode))

describe('keyboard navigation', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%s advances exactly one step', (k) => {
    const { result } = setup()
    key('ArrowRight') // index 1, a middle position
    const before = result.current.index
    key(k)
    expect(result.current.index).toBe(before + 1)
  })

  it.each([['ArrowLeft'], ['PageUp']])('%s goes back exactly one step', (k) => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    key(k)
    expect(result.current.index).toBe(1)
  })

  it('ignores unrelated keys and modified shortcuts', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    key('a')
    key('Enter')
    fireEvent.keyDown(document.body, { key: 'ArrowRight', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'ArrowRight', metaKey: true })
    expect(result.current.index).toBe(2)
  })

  it('removes its listeners on unmount, so remounting does not accumulate handlers', () => {
    const first = setup()
    first.unmount()
    const second = setup()
    key('ArrowRight')
    expect(first.result.current.index).toBe(0)
    expect(second.result.current.index).toBe(1)
  })

  it('moves once per key press under StrictMode double-invoked effects', () => {
    const { result } = renderHook(() => usePresentationNav(5), { wrapper: StrictMode })
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    key('ArrowLeft')
    expect(result.current.index).toBe(0)
  })
})

describe('mode', () => {
  it.each([['browse', 'present'], ['present', 'browse']] as const)('P toggles %s to %s and keeps the step', (from, to) => {
    const { result } = setup(5, from)
    act(() => result.current.goTo(3))
    key('p')
    expect(result.current.mode).toBe(to)
    expect(result.current.index).toBe(3)
    key('P')
    expect(result.current.mode).toBe(from)
    expect(result.current.index).toBe(3)
  })

  it('toggleMode (the on-screen path) keeps the step', () => {
    const { result } = setup(5, 'present')
    act(() => result.current.goTo(2))
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })
})

describe('swipe', () => {
  it('left swipe advances, right swipe goes back', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    touch(300, 100, 100, 100)
    expect(result.current.index).toBe(3)
    touch(100, 100, 300, 100)
    expect(result.current.index).toBe(2)
  })

  it('ignores sub-threshold and vertically dominant gestures', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    touch(100, 100, 80, 100)
    touch(300, 100, 200, 400)
    expect(result.current.index).toBe(2)
  })

  it('a cancelled touch cannot trigger a later gesture from stale coordinates', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 300, clientY: 0 }] })
    fireEvent.touchCancel(window)
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 0, clientY: 0 }] })
    expect(result.current.index).toBe(2)
  })

  it('swipeDirection classifies gestures', () => {
    expect(swipeDirection(-60, 5)).toBe(1)
    expect(swipeDirection(60, 5)).toBe(-1)
    expect(swipeDirection(39, 0)).toBe(0)
    expect(swipeDirection(50, 50)).toBe(0)
  })
})

describe('focused controls keep their keys', () => {
  const make = (html: string) => {
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.append(host)
    return host
  }

  it.each([
    ['button', '<button id="t">x</button>'],
    ['link', '<a id="t" href="#">x</a>'],
    ['input', '<input id="t">'],
    ['select', '<select id="t"><option>a</option></select>'],
    ['textarea', '<textarea id="t"></textarea>'],
    ['nested target inside a button', '<button><span id="t">x</span></button>'],
    ['contenteditable', '<div contenteditable="true"><b id="t">x</b></div>'],
  ])('%s: navigation keys and P do nothing to the deck and are not prevented', (_name, html) => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    const host = make(html)
    const target = host.querySelector('#t')!
    for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
      const notPrevented = fireEvent.keyDown(target, { key: k })
      expect(notPrevented).toBe(true)
    }
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
    host.remove()
  })

  it('ordinary document focus is the positive control', () => {
    const { result } = setup()
    const host = make('<div id="t">plain</div>')
    const notPrevented = fireEvent.keyDown(host.querySelector('#t')!, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
    expect(notPrevented).toBe(false)
    host.remove()
  })

  it('isInteractiveTarget rejects non-elements', () => {
    expect(isInteractiveTarget(null)).toBe(false)
    expect(isInteractiveTarget(window)).toBe(false)
  })
})

describe('boundaries', () => {
  it('clamps at the first step without wrapping', () => {
    const { result } = setup(3)
    key('ArrowLeft')
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('clamps at the last step without wrapping, through every path', () => {
    const { result } = setup(3)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    key('ArrowRight')
    key(' ')
    touch(300, 0, 100, 0)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('a single-step deck never moves', () => {
    const { result } = setup(1)
    key('ArrowRight')
    key('ArrowLeft')
    act(() => result.current.next())
    expect(result.current.index).toBe(0)
  })
})
