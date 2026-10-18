import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { SWIPE_MIN_PX, usePresentationNav } from '../presentation-kit'

function key(target: EventTarget, init: KeyboardEventInit & { key: string }) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

function swipe(dx: number, dy: number, target: EventTarget = document.body) {
  const point = (x: number, y: number) => ({ clientX: x, clientY: y }) as Touch
  const make = (type: string, touches: Touch[]) => {
    const event = new Event(type, { bubbles: true }) as Event & { touches: Touch[]; changedTouches: Touch[] }
    event.touches = type === 'touchend' ? [] : touches
    event.changedTouches = touches
    return event
  }
  act(() => {
    target.dispatchEvent(make('touchstart', [point(200, 200)]))
    target.dispatchEvent(make('touchend', [point(200 + dx, 200 + dy)]))
  })
}

function setup(count = 5, mode: 'present' | 'browse' = 'browse', start = 0) {
  const hook = renderHook(() => usePresentationNav(count, mode))
  act(() => hook.result.current.goTo(start))
  return hook
}

describe('keyboard navigation', () => {
  it.each([
    ['ArrowRight', 1],
    [' ', 1],
    ['PageDown', 1],
    ['ArrowLeft', -1],
    ['PageUp', -1],
  ])('%j moves by %i step in both modes and prevents the default', (k, delta) => {
    for (const mode of ['browse', 'present'] as const) {
      const { result } = setup(5, mode, 2)
      const event = key(document.body, { key: k })
      expect(result.current.index).toBe(2 + delta)
      expect(event.defaultPrevented).toBe(true)
    }
  })

  it('toggles mode with P and keeps the current step', () => {
    const { result } = setup(5, 'browse', 3)
    key(document.body, { key: 'p' })
    expect(result.current).toMatchObject({ mode: 'present', index: 3 })
    key(document.body, { key: 'P' })
    expect(result.current).toMatchObject({ mode: 'browse', index: 3 })
  })

  it('ignores unrelated keys without preventing them', () => {
    const { result } = setup(5, 'browse', 2)
    const event = key(document.body, { key: 'x' })
    expect(result.current.index).toBe(2)
    expect(event.defaultPrevented).toBe(false)
  })

  it('clamps at both ends instead of wrapping', () => {
    const { result } = setup(3, 'browse', 0)
    key(document.body, { key: 'ArrowLeft' })
    key(document.body, { key: 'PageUp' })
    expect(result.current.index).toBe(0)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    key(document.body, { key: 'ArrowRight' })
    key(document.body, { key: ' ' })
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('leaves keys to focused controls, including P and nested targets', () => {
    const { result } = setup(5, 'browse', 2)
    const html = `
      <button id="b"><span id="nested">x</span></button><a href="#" id="a">a</a>
      <input id="i"><select id="s"></select><textarea id="t"></textarea>
      <details><summary id="sum">s</summary></details>
      <div id="ce" contenteditable="true"></div>
      <div id="rb" role="button"></div><div id="rl" role="link"></div><div id="rt" role="tab"></div>`
    document.body.insertAdjacentHTML('beforeend', html)
    for (const id of ['b', 'nested', 'a', 'i', 's', 't', 'sum', 'ce', 'rb', 'rl', 'rt']) {
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
        const event = key(document.getElementById(id)!, { key: k })
        expect(event.defaultPrevented, `${id} ${k}`).toBe(false)
      }
    }
    expect(result.current).toMatchObject({ index: 2, mode: 'browse' })
    document.body.innerHTML = ''
  })

  it('ignores Ctrl, Meta, and Alt combinations', () => {
    const { result } = setup(5, 'browse', 2)
    for (const mod of ['ctrlKey', 'metaKey', 'altKey']) {
      for (const k of ['ArrowRight', 'p']) {
        const event = key(document.body, { key: k, [mod]: true })
        expect(event.defaultPrevented).toBe(false)
      }
    }
    expect(result.current).toMatchObject({ index: 2, mode: 'browse' })
  })

  it('removes its listeners on unmount and handles one event once under StrictMode', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    const { result, unmount } = renderHook(() => usePresentationNav(5, 'browse'), { wrapper })
    key(document.body, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
    key(document.body, { key: 'p' })
    expect(result.current.mode).toBe('present')
    unmount()
    const event = key(document.body, { key: 'ArrowRight' })
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('touch swipe', () => {
  it('names a 40px threshold', () => {
    expect(SWIPE_MIN_PX).toBe(40)
  })

  it.each([
    [-41, 'advances'],
    [-40, 'advances'],
    [41, 'goes back'],
    [40, 'goes back'],
  ])('dx %i %s', (dx, outcome) => {
    const { result } = setup(5, 'browse', 2)
    swipe(dx, 0)
    expect(result.current.index).toBe(outcome === 'advances' ? 3 : 1)
  })

  it('ignores short, vertical, tied, and control-origin gestures', () => {
    const { result } = setup(5, 'browse', 2)
    swipe(-39, 0)
    swipe(0, -120)
    swipe(-60, 60)
    swipe(-60, 90)
    const button = document.createElement('button')
    document.body.append(button)
    swipe(-120, 0, button)
    button.remove()
    expect(result.current.index).toBe(2)
  })
})
