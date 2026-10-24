import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit'

const key = (k: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  })

function touch(type: 'touchstart' | 'touchend', x: number, y: number) {
  const e = new Event(type, { bubbles: true })
  Object.defineProperty(e, 'changedTouches', { value: [{ clientX: x, clientY: y }] })
  act(() => {
    window.dispatchEvent(e)
  })
}
const swipe = (dx: number, dy = 0) => {
  touch('touchstart', 300, 300)
  touch('touchend', 300 + dx, 300 + dy)
}

const setup = (count = 9, wrapper?: typeof StrictMode) => renderHook(() => usePresentationNav(count), { wrapper })

describe('usePresentationNav', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('advances exactly one step on %j', (k) => {
    const { result } = setup()
    key(k)
    expect(result.current.index).toBe(1)
  })

  it.each([['ArrowLeft'], ['PageUp']])('goes back exactly one step on %j', (k) => {
    const { result } = setup()
    act(() => result.current.jump(4))
    key(k)
    expect(result.current.index).toBe(3)
  })

  it('clamps at the first and last steps without wrapping', () => {
    const { result } = setup(9)
    key('ArrowLeft')
    expect(result.current.index).toBe(0)
    act(() => result.current.jump(99))
    expect(result.current.index).toBe(8)
    key('ArrowRight')
    swipe(-100)
    act(() => result.current.next())
    expect(result.current.index).toBe(8)
    act(() => result.current.jump(-5))
    expect(result.current.index).toBe(0)
    swipe(100)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('toggles mode with P in both directions while keeping the step', () => {
    const { result } = setup()
    act(() => result.current.jump(4))
    expect(result.current.mode).toBe('browse')
    key('p')
    expect(result.current).toMatchObject({ mode: 'present', index: 4 })
    key('P')
    expect(result.current).toMatchObject({ mode: 'browse', index: 4 })
  })

  it('honours the initial mode', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'present'))
    expect(result.current.mode).toBe('present')
  })

  it('swipes: left advances, right goes back, short or vertical-dominant do nothing', () => {
    const { result } = setup()
    swipe(-49)
    expect(result.current.index).toBe(0)
    swipe(-50)
    expect(result.current.index).toBe(1)
    swipe(-100, 100)
    expect(result.current.index).toBe(1)
    swipe(-100, 150)
    expect(result.current.index).toBe(1)
    swipe(100, 10)
    expect(result.current.index).toBe(0)
  })

  it('ignores a touchend with no matching touchstart', () => {
    const { result } = setup()
    touch('touchend', 0, 0)
    expect(result.current.index).toBe(0)
  })

  it('leaves keys to focused controls and their descendants', () => {
    const { result } = setup()
    const host = document.createElement('div')
    host.innerHTML = '<button id="b"><span id="s"></span></button><input id="i"><select id="sel"></select><textarea id="t"></textarea><a href="#" id="a"></a>'
    document.body.append(host)
    for (const id of ['b', 's', 'i', 'sel', 't', 'a']) {
      const target = host.querySelector(`#${id}`)!
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'p']) {
        const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
        act(() => {
          target.dispatchEvent(e)
        })
        expect(e.defaultPrevented, `${id} ${k}`).toBe(false)
      }
    }
    expect(result.current).toMatchObject({ index: 0, mode: 'browse' })
    host.remove()
    key('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  it('ignores keys combined with modifiers', () => {
    const { result } = setup()
    key('ArrowRight', document.body, { ctrlKey: true })
    key('ArrowRight', document.body, { metaKey: true })
    key('ArrowRight', document.body, { altKey: true })
    expect(result.current.index).toBe(0)
  })

  it('prevents default only for handled keys', () => {
    setup()
    const handled = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    act(() => {
      window.dispatchEvent(handled)
      window.dispatchEvent(other)
    })
    expect(handled.defaultPrevented).toBe(true)
    expect(other.defaultPrevented).toBe(false)
  })

  it('removes its listeners on unmount so remounting cannot double-handle', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const first = setup()
    first.unmount()
    expect(remove.mock.calls.map((c) => c[0]).sort()).toEqual(add.mock.calls.map((c) => c[0]).sort())
    const second = setup()
    key('ArrowRight')
    expect(second.result.current.index).toBe(1)
    vi.restoreAllMocks()
  })

  it('advances one step per key under StrictMode effect replay', () => {
    const { result } = setup(9, StrictMode)
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    swipe(-80)
    expect(result.current.index).toBe(2)
    key('p')
    expect(result.current.mode).toBe('present')
  })

  it('clamps the index when the step count shrinks', () => {
    let count = 9
    const { result, rerender } = renderHook(() => usePresentationNav(count))
    act(() => result.current.jump(8))
    count = 3
    rerender()
    expect(result.current.index).toBe(2)
  })
})
