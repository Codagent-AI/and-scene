// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { clampIndex, isInteractiveTarget, swipeStep, usePresentationNav } from '../../src/presentation-kit'

afterEach(cleanup)

const press = (key: string, target: EventTarget = window) =>
  act(() => {
    fireEvent.keyDown(target, { key })
  })

const swipe = (from: [number, number], to: [number, number]) =>
  act(() => {
    fireEvent.touchStart(window, { changedTouches: [{ clientX: from[0], clientY: from[1] }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: to[0], clientY: to[1] }] })
  })

describe('keyboard navigation', () => {
  it('advances exactly one step for Right, Space and PageDown, and goes back for Left and PageUp', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    for (const key of ['ArrowRight', ' ', 'PageDown']) {
      const before = result.current.index
      press(key)
      expect(result.current.index).toBe(before + 1)
    }
    for (const key of ['ArrowLeft', 'PageUp']) {
      const before = result.current.index
      press(key)
      expect(result.current.index).toBe(before - 1)
    }
  })

  it('ignores unrelated keys and modified shortcuts', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    press('a')
    press('ArrowDown')
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    })
    expect(result.current.index).toBe(0)
  })

  it('P toggles the mode in both directions and keeps the current step', () => {
    const { result } = renderHook(() => usePresentationNav(9, { initialMode: 'browse' }))
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    press('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })
})

describe('boundaries', () => {
  it('clamps at the start and the end, including repeated events', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    press('ArrowLeft')
    press('PageUp')
    expect(result.current.index).toBe(0)
    for (let i = 0; i < 6; i++) press('ArrowRight')
    expect(result.current.index).toBe(2)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    swipe([300, 0], [100, 0])
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-5))
    expect(result.current.index).toBe(0)
    swipe([100, 0], [300, 0])
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('clampIndex bounds both ends', () => {
    expect(clampIndex(-1, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(2, 4)).toBe(2)
  })

  it('re-clamps when the step array shrinks', () => {
    const { result, rerender } = renderHook(({ n }) => usePresentationNav(n), { initialProps: { n: 5 } })
    act(() => result.current.goTo(4))
    rerender({ n: 3 })
    expect(result.current.index).toBe(2)
  })
})

describe('touch swipe', () => {
  it('swipe left advances and swipe right goes back, once each', () => {
    const { result } = renderHook(() => usePresentationNav(9, { initialIndex: 4 }))
    swipe([300, 100], [200, 100])
    expect(result.current.index).toBe(5)
    swipe([200, 100], [300, 100])
    expect(result.current.index).toBe(4)
  })

  it('needs at least 40px of mostly horizontal travel', () => {
    expect(swipeStep(-39, 0)).toBe(0)
    expect(swipeStep(-40, 0)).toBe(1)
    expect(swipeStep(40, 0)).toBe(-1)
    expect(swipeStep(-80, 90)).toBe(0)
    expect(swipeStep(-80, 80)).toBe(0)
    expect(swipeStep(-80, 79)).toBe(1)
    const { result } = renderHook(() => usePresentationNav(9, { initialIndex: 4 }))
    swipe([300, 100], [270, 100])
    swipe([300, 100], [200, 300])
    expect(result.current.index).toBe(4)
  })
})

describe('focused controls keep their keys', () => {
  it('does not navigate or preventDefault for keys typed into interactive elements', () => {
    const { result } = renderHook(() => usePresentationNav(9, { initialIndex: 3 }))
    const host = document.createElement('div')
    host.innerHTML =
      '<button id="b"><span id="inner">x</span></button><a href="/x" id="a">a</a><input id="i"><select id="s"></select><textarea id="t"></textarea><div contenteditable="true" id="c"></div>'
    document.body.append(host)
    for (const id of ['b', 'inner', 'a', 'i', 's', 't', 'c']) {
      for (const key of ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'p']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        act(() => {
          host.querySelector(`#${id}`)!.dispatchEvent(event)
        })
        expect(event.defaultPrevented).toBe(false)
      }
    }
    expect(result.current.index).toBe(3)
    expect(result.current.mode).toBe('browse')
    expect(isInteractiveTarget(document.body)).toBe(false)
    host.remove()
  })
})

describe('StrictMode', () => {
  it('registers a single effective key handler after the double effect run', () => {
    let latest = 0
    function Probe() {
      latest = usePresentationNav(9).index
      return null
    }
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(latest).toBe(1)
  })
})
