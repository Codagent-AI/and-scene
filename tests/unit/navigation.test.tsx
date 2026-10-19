import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { Presentation, SWIPE_MIN_PX, usePresentationNav } from '../../src/presentation-kit'
import { swipeAction } from '../../src/presentation-kit/navigation'
import { currentIndex, makeSteps, press, swipe } from './helpers'

function hook(count = 5, mode?: 'browse' | 'present') {
  return renderHook(() => usePresentationNav(count, mode))
}

describe('keyboard navigation', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%j advances exactly one step', (key) => {
    const { result } = hook()
    const event = new KeyboardEvent('keydown', { key, cancelable: true })
    act(() => void window.dispatchEvent(event))
    expect(result.current.index).toBe(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it.each([['ArrowLeft'], ['PageUp']])('%s goes back exactly one step', (key) => {
    const { result } = hook()
    act(() => result.current.goTo(3))
    const event = new KeyboardEvent('keydown', { key, cancelable: true })
    act(() => void window.dispatchEvent(event))
    expect(result.current.index).toBe(2)
    expect(event.defaultPrevented).toBe(true)
  })

  it('ignores unrelated keys and modified shortcuts', () => {
    const { result } = hook()
    for (const init of [{ key: 'a' }, { key: 'ArrowDown' }, { key: 'ArrowRight', ctrlKey: true }, { key: 'ArrowRight', metaKey: true }, { key: 'ArrowRight', altKey: true }, { key: 'p', ctrlKey: true }]) {
      const event = new KeyboardEvent('keydown', { ...init, cancelable: true })
      act(() => void window.dispatchEvent(event))
      expect(event.defaultPrevented).toBe(false)
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
  })

  it('toggles mode with P and keeps the current step', () => {
    const { result } = hook()
    act(() => result.current.goTo(2))
    act(() => void press('p'))
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    act(() => void press('P'))
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('honours the initial mode and defaults to browse', () => {
    expect(hook(3).result.current.mode).toBe('browse')
    expect(hook(3, 'present').result.current.mode).toBe('present')
  })
})

describe('focused controls keep their keys', () => {
  const make = (html: string) => {
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)
    return host
  }

  it.each([
    ['button', '<button id="t">go</button>'],
    ['link', '<a id="t" href="/x">go</a>'],
    ['input', '<input id="t" />'],
    ['textarea', '<textarea id="t"></textarea>'],
    ['select', '<select id="t"><option>a</option></select>'],
    ['summary', '<details><summary id="t">more</summary></details>'],
    ['contenteditable', '<div id="t" contenteditable="true">x</div>'],
    ['aria role', '<div id="t" role="slider" tabindex="0"></div>'],
    ['descendant of a control', '<button><span id="t">go</span></button>'],
  ])('%s: keys and P neither navigate nor get default-prevented', (_name, html) => {
    const { result } = hook()
    const host = make(html)
    const target = host.querySelector('#t')!
    for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'p']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      act(() => void target.dispatchEvent(event))
      expect(event.defaultPrevented).toBe(false)
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    host.remove()
  })

  it('still navigates when the key targets the body', () => {
    const { result } = hook()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    act(() => void document.body.dispatchEvent(event))
    expect(result.current.index).toBe(1)
  })
})

describe('touch swipe', () => {
  it('swiping left advances and right goes back', () => {
    const { result } = hook()
    act(() => swipe([300, 100], [100, 110]))
    expect(result.current.index).toBe(1)
    act(() => swipe([100, 100], [300, 90]))
    expect(result.current.index).toBe(0)
  })

  it('uses the 50px threshold: below ignored, at/above handled', () => {
    expect(swipeAction({ x: 100, y: 0 }, { x: 100 - (SWIPE_MIN_PX - 1), y: 0 })).toBeNull()
    expect(swipeAction({ x: 100, y: 0 }, { x: 100 - SWIPE_MIN_PX, y: 0 })).toBe('next')
    expect(swipeAction({ x: 100, y: 0 }, { x: 100 + SWIPE_MIN_PX, y: 0 })).toBe('prev')
  })

  it('ignores gestures whose vertical travel equals or exceeds horizontal', () => {
    expect(swipeAction({ x: 0, y: 0 }, { x: -80, y: 80 })).toBeNull()
    expect(swipeAction({ x: 0, y: 0 }, { x: -80, y: 120 })).toBeNull()
    expect(swipeAction({ x: 0, y: 0 }, { x: 80, y: -79 })).toBe('prev')
  })

  it('a canceled gesture leaves no stale start', () => {
    const { result } = hook()
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 300, clientY: 0 }] })
    fireEvent.touchCancel(window)
    act(() => void fireEvent.touchEnd(window, { changedTouches: [{ clientX: 100, clientY: 0 }] }))
    expect(result.current.index).toBe(0)
  })
})

describe('boundaries', () => {
  it('clamps at both ends via keys, swipes and calls', () => {
    const { result } = hook(3)
    act(() => void press('ArrowLeft'))
    act(() => swipe([100, 0], [300, 0]))
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(2))
    act(() => void press('ArrowRight'))
    act(() => void press(' '))
    act(() => swipe([300, 0], [100, 0]))
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('clamps out-of-range jumps and works with one step', () => {
    const { result } = hook(4)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(3)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
    const single = hook(1)
    act(() => single.result.current.next())
    act(() => single.result.current.prev())
    expect(single.result.current.index).toBe(0)
  })

  it('does not wrap on the rendered presentation either', () => {
    render(<Presentation steps={makeSteps(['a', 'b'])} title="deck" />)
    act(() => void press('ArrowLeft'))
    expect(currentIndex()).toBe(0)
    act(() => void press('ArrowRight'))
    act(() => void press('ArrowRight'))
    expect(currentIndex()).toBe(1)
  })
})

describe('StrictMode', () => {
  it('changes the index once per key and swipe after effect replay, and cleans up on unmount', () => {
    const wrapper = StrictMode
    const { result, unmount } = renderHook(() => usePresentationNav(5), { wrapper })
    act(() => void press('ArrowRight'))
    expect(result.current.index).toBe(1)
    act(() => swipe([300, 0], [100, 0]))
    expect(result.current.index).toBe(2)
    unmount()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
