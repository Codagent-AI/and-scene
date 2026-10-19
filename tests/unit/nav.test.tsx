// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { keyAction, swipeAction, usePresentationNav } from '../../src/presentation-kit/usePresentationNav.ts'

const press = (key: string, init: KeyboardEventInit = {}, target: Element | Window = window) =>
  act(() => {
    fireEvent.keyDown(target, { key, ...init })
  })

const swipe = (dx: number, dy: number) => {
  act(() => {
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 300, clientY: 300 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 300 + dx, clientY: 300 + dy }] })
  })
}

const setup = (count = 5, mode: 'browse' | 'present' = 'present') => renderHook(() => usePresentationNav(count, mode))

describe('keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (key) => {
    const { result } = setup()
    press(key)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (key) => {
    const { result } = setup()
    act(() => result.current.goTo(3))
    press(key)
    expect(result.current.index).toBe(2)
  })

  it('P toggles the mode both ways and keeps the index', () => {
    const { result } = setup(5, 'present')
    act(() => result.current.goTo(2))
    press('p')
    expect(result.current.mode).toBe('browse')
    press('P')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
  })

  it('ignores unrelated keys and modifier combinations', () => {
    const { result } = setup()
    press('a')
    press('ArrowRight', { ctrlKey: true })
    press('ArrowRight', { altKey: true })
    press('ArrowRight', { metaKey: true })
    press('p', { metaKey: true })
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
  })

  it('does not double-handle after rerender', () => {
    const { result, rerender } = setup()
    rerender()
    press('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  it('removes its listeners on unmount', () => {
    const { result, unmount } = setup()
    unmount()
    press('ArrowRight')
    expect(result.current.index).toBe(0)
  })

  it('registers one listener under StrictMode replay and cleans up', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(5, 'present'), { wrapper: StrictMode })
    press('ArrowRight')
    expect(result.current.index).toBe(1)
    unmount()
    press('ArrowRight')
    expect(result.current.index).toBe(1)
  })
})

describe('focused controls keep their keys', () => {
  const make = (html: string) => {
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)
    return host
  }

  const cases: Record<string, string> = {
    button: '<button id="t">b</button>',
    link: '<a id="t" href="#x">a</a>',
    input: '<input id="t" />',
    select: '<select id="t"><option>1</option></select>',
    textarea: '<textarea id="t"></textarea>',
    summary: '<details><summary id="t">s</summary></details>',
    contenteditable: '<div id="t" contenteditable="true">x</div>',
    'aria role': '<div id="t" role="slider" tabindex="0"></div>',
    'nested target': '<button><span id="t">inner</span></button>',
  }

  it.each(Object.keys(cases))('%s: navigation keys do nothing and are not prevented', (name) => {
    const host = make(cases[name])
    const target = host.querySelector('#t') as HTMLElement
    const { result } = setup()
    for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      act(() => {
        target.dispatchEvent(ev)
      })
      expect(ev.defaultPrevented).toBe(false)
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
    host.remove()
  })

  it('respects the active element even when the event targets the document', () => {
    const host = make('<button id="t">b</button>')
    ;(host.querySelector('#t') as HTMLElement).focus()
    expect(keyAction({ key: 'ArrowRight', ctrlKey: false, altKey: false, metaKey: false, target: document.body })).toBeNull()
    host.remove()
  })

  it('prevents default only for keys it handles', () => {
    setup()
    const handled = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    const ignored = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })
    act(() => {
      window.dispatchEvent(handled)
      window.dispatchEvent(ignored)
    })
    expect(handled.defaultPrevented).toBe(true)
    expect(ignored.defaultPrevented).toBe(false)
  })
})

describe('touch swipe', () => {
  it('swiping left advances and right goes back', () => {
    const { result } = setup()
    swipe(-80, 5)
    expect(result.current.index).toBe(1)
    swipe(80, -5)
    expect(result.current.index).toBe(0)
  })

  it('ignores short, vertical-dominant and equal-axis gestures', () => {
    const { result } = setup()
    swipe(-49, 0)
    swipe(-80, 120)
    swipe(-60, 60)
    swipe(0, 0)
    expect(result.current.index).toBe(0)
    expect(swipeAction(-50, 10)).toBe('next')
    expect(swipeAction(50, 49)).toBe('prev')
    expect(swipeAction(-60, 60)).toBeNull()
  })
})

describe('boundaries', () => {
  it('clamps at the start and the end for every input path', () => {
    const { result } = setup(3)
    press('ArrowLeft')
    press('PageUp')
    swipe(80, 0)
    act(() => result.current.prev())
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(2))
    press('ArrowRight')
    press(' ')
    swipe(-80, 0)
    act(() => result.current.next())
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
  })

  it('stays valid with a single step', () => {
    const { result } = setup(1)
    press('ArrowRight')
    press('ArrowLeft')
    act(() => result.current.goTo(5))
    expect(result.current.index).toBe(0)
  })
})

describe('shrinking step count', () => {
  it('never exposes an index past the last step, and handles zero steps', () => {
    const { result, rerender } = renderHook(({ n }) => usePresentationNav(n, 'present'), { initialProps: { n: 5 } })
    act(() => result.current.goTo(4))
    rerender({ n: 3 })
    expect(result.current.index).toBe(2)
    rerender({ n: 0 })
    expect(result.current.index).toBe(0)
  })
})
