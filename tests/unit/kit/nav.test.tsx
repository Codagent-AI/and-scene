import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SWIPE_MIN_PX } from '../../../src/presentation-kit/constants.ts'
import { usePresentationNav } from '../../../src/presentation-kit/usePresentationNav.ts'

const press = (key: string, init: KeyboardEventInit = {}, target: Element | Window = window) =>
  act(() => {
    fireEvent.keyDown(target, { key, ...init })
  })

const touch = (from: [number, number], to: [number, number]) =>
  act(() => {
    fireEvent.touchStart(window, { touches: [{ clientX: from[0], clientY: from[1] }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: to[0], clientY: to[1] }], touches: [] })
  })

function setup(count = 5, mode: 'browse' | 'present' = 'browse', wrapper?: React.ComponentType<{ children: React.ReactNode }>) {
  return renderHook(() => usePresentationNav(count, mode), { wrapper })
}

describe('keyboard (L-18)', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly once', (key) => {
    const { result } = setup()
    press(key)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly once', (key) => {
    const { result } = setup()
    act(() => result.current.goTo(3))
    press(key)
    expect(result.current.index).toBe(2)
  })

  it('ignores unrelated keys and removes listeners on unmount', () => {
    const { result, unmount } = setup()
    press('x')
    press('Enter')
    expect(result.current.index).toBe(0)
    const spy = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(spy.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['keydown', 'touchstart', 'touchend']))
    press('ArrowRight')
    expect(result.current.index).toBe(0)
    spy.mockRestore()
  })
})

describe('mode toggle (L-17)', () => {
  it('toggles with P twice and keeps the step', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    press('p')
    expect(result.current).toMatchObject({ mode: 'present', index: 2 })
    press('P')
    expect(result.current).toMatchObject({ mode: 'browse', index: 2 })
  })

  it('honours either opening mode', () => {
    expect(setup(3, 'present').result.current.mode).toBe('present')
    expect(setup(3, 'browse').result.current.mode).toBe('browse')
  })
})

describe('swipe (L-19)', () => {
  it('swipes left to advance and right to go back', () => {
    const { result } = setup()
    touch([200, 100], [100, 100])
    expect(result.current.index).toBe(1)
    touch([100, 100], [200, 100])
    expect(result.current.index).toBe(0)
  })

  it('needs at least the minimum horizontal travel', () => {
    const { result } = setup()
    touch([200, 100], [200 - (SWIPE_MIN_PX - 1), 100])
    expect(result.current.index).toBe(0)
    touch([200, 100], [200 - SWIPE_MIN_PX, 100])
    expect(result.current.index).toBe(1)
  })

  it('ignores vertical-dominant and equal-axis gestures', () => {
    const { result } = setup()
    touch([200, 100], [100, 300])
    touch([200, 100], [100, 200])
    expect(result.current.index).toBe(0)
  })

  it('ignores multi-touch starts', () => {
    const { result } = setup()
    act(() => {
      fireEvent.touchStart(window, { touches: [{ clientX: 300, clientY: 0 }, { clientX: 0, clientY: 0 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 100, clientY: 0 }], touches: [] })
    })
    expect(result.current.index).toBe(0)
  })
})

describe('focused controls keep their keys (L-22)', () => {
  const controls: Record<string, () => HTMLElement> = {
    button: () => Object.assign(document.createElement('button'), { textContent: 'b' }),
    anchor: () => Object.assign(document.createElement('a'), { href: '/x' }),
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
  }

  for (const [name, make] of Object.entries(controls)) {
    it.each(['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p'])(`${name} keeps %j`, (key) => {
      const { result } = setup()
      act(() => result.current.goTo(2))
      const control = make()
      document.body.append(control)
      const child = document.createElement('span')
      control.append(child)
      let prevented = false
      for (const target of [control, child]) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        act(() => {
          target.dispatchEvent(event)
        })
        prevented ||= event.defaultPrevented
      }
      expect(result.current).toMatchObject({ index: 2, mode: 'browse' })
      expect(prevented).toBe(false)
      control.remove()
    })
  }

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }])('ignores %o combinations', (mods) => {
    const { result } = setup()
    press('ArrowRight', mods)
    press('p', mods)
    expect(result.current).toMatchObject({ index: 0, mode: 'browse' })
  })
})

describe('boundaries (L-23, L-24)', () => {
  it('clamps at both ends for keys and swipes', () => {
    const { result } = setup(3)
    press('ArrowLeft')
    press('PageUp')
    act(() => result.current.prev())
    touch([100, 0], [200, 0])
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(2))
    press('ArrowRight')
    act(() => result.current.next())
    touch([200, 0], [100, 0])
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('stays put in a single-step presentation', () => {
    const { result } = setup(1)
    press('ArrowRight')
    press('ArrowLeft')
    expect(result.current.index).toBe(0)
  })
})

describe('StrictMode (L-78)', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <StrictMode>{children}</StrictMode>

  it('changes step and mode exactly once per key, across rerenders', () => {
    const { result, rerender } = setup(5, 'browse', wrapper)
    press('ArrowRight')
    expect(result.current.index).toBe(1)
    rerender()
    press('ArrowRight')
    expect(result.current.index).toBe(2)
    press('p')
    expect(result.current.mode).toBe('present')
    rerender()
    press('p')
    expect(result.current.mode).toBe('browse')
  })

  it('leaves no listeners after unmount and remount', () => {
    const first = setup(5, 'browse', wrapper)
    first.unmount()
    const second = setup(5, 'browse', wrapper)
    press('ArrowRight')
    expect(first.result.current.index).toBe(0)
    expect(second.result.current.index).toBe(1)
  })

  it('renders without issue in a component', () => {
    function C() {
      const nav = usePresentationNav(3)
      return <span data-testid="i">{nav.index}</span>
    }
    const { getByTestId } = render(<StrictMode><C /></StrictMode>)
    press('ArrowRight')
    expect(getByTestId('i').textContent).toBe('1')
  })
})
