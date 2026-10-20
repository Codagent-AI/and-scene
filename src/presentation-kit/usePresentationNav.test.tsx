import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { isInteractiveTarget, usePresentationNav } from './usePresentationNav.ts'

const key = (k: string, target: Element = document.body) =>
  act(() => {
    fireEvent.keyDown(target, { key: k })
  })

const swipe = (from: [number, number], to: [number, number]) =>
  act(() => {
    fireEvent.touchStart(document.body, { changedTouches: [{ clientX: from[0], clientY: from[1] }] })
    fireEvent.touchEnd(document.body, { changedTouches: [{ clientX: to[0], clientY: to[1] }] })
  })

const nav = (count = 5, mode?: 'present' | 'browse') => renderHook(() => usePresentationNav(count, mode))

describe('keyboard', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (k) => {
    const { result } = nav()
    key(k)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (k) => {
    const { result } = nav()
    act(() => result.current.goTo(3))
    key(k)
    expect(result.current.index).toBe(2)
  })

  it('ignores unrelated keys and modified shortcuts', () => {
    const { result } = nav()
    key('a')
    key('ArrowUp')
    act(() => {
      fireEvent.keyDown(document.body, { key: 'ArrowRight', ctrlKey: true })
    })
    expect(result.current.index).toBe(0)
  })

  it('toggles the mode with P and keeps the step', () => {
    const { result } = nav(5, 'browse')
    act(() => result.current.goTo(2))
    key('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    key('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
  })

  it('opens in the requested initial mode', () => {
    expect(nav(3, 'present').result.current.mode).toBe('present')
    expect(nav(3).result.current.mode).toBe('browse')
  })
})

describe('boundaries', () => {
  it('clamps at the first step through keys and actions', () => {
    const { result } = nav()
    key('ArrowLeft')
    key('PageUp')
    act(() => result.current.prev())
    act(() => result.current.goTo(-3))
    expect(result.current.index).toBe(0)
  })

  it('clamps at the last step with no wrap-around', () => {
    const { result } = nav(3)
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    key(' ')
    act(() => result.current.next())
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
  })

  it('clamps swipes at both ends', () => {
    const { result } = nav(2)
    swipe([100, 100], [300, 100])
    expect(result.current.index).toBe(0)
    swipe([300, 100], [100, 100])
    swipe([300, 100], [100, 100])
    expect(result.current.index).toBe(1)
  })
})

describe('touch swipe', () => {
  it('swipe left advances and swipe right goes back', () => {
    const { result } = nav()
    swipe([300, 100], [100, 110])
    expect(result.current.index).toBe(1)
    swipe([100, 100], [300, 90])
    expect(result.current.index).toBe(0)
  })

  it('ignores short, vertical, and diagonal gestures', () => {
    const { result } = nav()
    swipe([300, 100], [270, 100])
    swipe([300, 100], [300, 400])
    swipe([300, 100], [200, 300])
    expect(result.current.index).toBe(0)
  })
})

describe('controls keep their keys', () => {
  it('identifies interactive targets and their descendants', () => {
    document.body.innerHTML = '<button><span id="in">x</span></button><a href="#">l</a><input /><div id="plain"></div>'
    expect(isInteractiveTarget(document.getElementById('in'))).toBe(true)
    expect(isInteractiveTarget(document.querySelector('a'))).toBe(true)
    expect(isInteractiveTarget(document.querySelector('input'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('plain'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
    document.body.innerHTML = ''
  })

  it.each(['ArrowRight', ' ', 'Enter', 'PageDown', 'ArrowLeft', 'p'])(
    'does not navigate or prevent %j from a focused control',
    (k) => {
      const onKey = vi.fn()
      const { getByRole, getByLabelText, result } = (() => {
        const r = renderHook(() => usePresentationNav(5))
        const view = render(
          <div>
            <button onKeyDown={onKey}>go</button>
            <input aria-label="field" onKeyDown={onKey} />
          </div>,
        )
        return { ...view, result: r.result }
      })()
      for (const el of [getByRole('button'), getByLabelText('field')]) {
        const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
        act(() => {
          el.dispatchEvent(event)
        })
        expect(event.defaultPrevented).toBe(false)
      }
      expect(onKey).toHaveBeenCalledTimes(2)
      expect(result.current.index).toBe(0)
      expect(result.current.mode).toBe('browse')
    },
  )
})

describe('StrictMode', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>

  it('advances once per event after the lifecycle replay', () => {
    const { result } = renderHook(() => usePresentationNav(5), { wrapper })
    key('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  it('removes its listeners on unmount and does not accumulate them on remount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const first = renderHook(() => usePresentationNav(5), { wrapper })
    first.unmount()
    const second = renderHook(() => usePresentationNav(5), { wrapper })
    key('ArrowRight')
    expect(second.result.current.index).toBe(1)
    expect(first.result.current.index).toBe(0)
    second.unmount()
    const adds = add.mock.calls.filter(([t]) => t === 'keydown').length
    const removes = remove.mock.calls.filter(([t]) => t === 'keydown').length
    expect(removes).toBe(adds)
    add.mockRestore()
    remove.mockRestore()
  })
})
