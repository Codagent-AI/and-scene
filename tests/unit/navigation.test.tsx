import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction, usePresentationNav } from '../../src/presentation-kit'

const key = (k: string, init: KeyboardEventInit = {}, target: Element | Window = window) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

const swipe = (dx: number, dy = 0) => {
  act(() => {
    fireEvent.touchStart(window, { touches: [{ clientX: 300, clientY: 300 }], changedTouches: [{ clientX: 300, clientY: 300 }] })
    fireEvent.touchEnd(window, { touches: [], changedTouches: [{ clientX: 300 + dx, clientY: 300 + dy }] })
  })
}

describe('pure navigation rules', () => {
  it('clamps indices', () => {
    expect([clampIndex(-3, 5), clampIndex(2, 5), clampIndex(9, 5)]).toEqual([0, 2, 4])
  })

  it('maps keys to actions and ignores modifier combinations', () => {
    const plain = { ctrlKey: false, metaKey: false, altKey: false }
    expect(['ArrowRight', ' ', 'PageDown'].map((k) => keyAction({ key: k, ...plain }))).toEqual(['next', 'next', 'next'])
    expect(['ArrowLeft', 'PageUp'].map((k) => keyAction({ key: k, ...plain }))).toEqual(['prev', 'prev'])
    expect([keyAction({ key: 'p', ...plain }), keyAction({ key: 'P', ...plain }), keyAction({ key: 'x', ...plain })]).toEqual(['toggle-mode', 'toggle-mode', null])
    for (const mod of ['ctrlKey', 'metaKey', 'altKey'] as const) {
      expect(keyAction({ key: 'ArrowRight', ...plain, [mod]: true })).toBeNull()
    }
  })

  it('swipes only at 50px with horizontal dominance', () => {
    expect([swipeAction(-50, 0), swipeAction(50, 0)]).toEqual(['next', 'prev'])
    expect(swipeAction(-49, 0)).toBeNull()
    expect(swipeAction(-80, 80)).toBeNull() // equal axes
    expect(swipeAction(-60, 90)).toBeNull() // vertical dominant
    expect(swipeAction(-80, 79)).toBe('next')
  })

  it('treats the documented controls as interactive', () => {
    const make = (html: string) => {
      const host = document.createElement('div')
      host.innerHTML = html
      return host.firstElementChild!
    }
    for (const html of [
      '<button></button>', '<a href="/x"></a>', '<input>', '<select></select>', '<textarea></textarea>',
      '<summary></summary>', '<div contenteditable="true"></div>', '<div contenteditable=""></div>',
      '<div role="button"></div>', '<span role="link"></span>', '<div role="tab"></div>',
    ]) {
      expect(isInteractiveTarget(make(html)), html).toBe(true)
    }
    for (const html of ['<div></div>', '<a>no href</a>', '<div contenteditable="false"></div>', '<div role="presentation"></div>']) {
      expect(isInteractiveTarget(make(html)), html).toBe(false)
    }
    expect(isInteractiveTarget(null)).toBe(false)
    expect(isInteractiveTarget(window)).toBe(false)
  })
})

describe('usePresentationNav', () => {
  const setup = (count = 5, mode: 'browse' | 'present' = 'browse', wrapper?: ({ children }: { children: ReactNode }) => ReactNode) =>
    renderHook(() => usePresentationNav(count, mode), { wrapper })

  it('advances on Right, Space and PageDown and goes back on Left and PageUp, preventing scroll', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    for (const k of ['ArrowRight', ' ', 'PageDown']) {
      const before = result.current.index
      const e = key(k)
      expect(result.current.index).toBe(before + 1)
      expect(e.defaultPrevented).toBe(true)
      act(() => result.current.goTo(2))
    }
    for (const k of ['ArrowLeft', 'PageUp']) {
      key(k)
      expect(result.current.index).toBe(1)
      act(() => result.current.goTo(2))
    }
  })

  it('clamps at both ends for keys, swipes and controls (no wrap)', () => {
    const { result } = setup(3)
    key('ArrowLeft')
    key('PageUp')
    swipe(100)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    key('ArrowRight')
    key(' ')
    swipe(-100)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('moves one step per swipe: left advances, right goes back; small or vertical gestures are ignored', () => {
    const { result } = setup()
    swipe(-80)
    expect(result.current.index).toBe(1)
    swipe(-80)
    expect(result.current.index).toBe(2)
    swipe(80)
    expect(result.current.index).toBe(1)
    swipe(-49)
    swipe(-80, 80)
    swipe(-60, 120)
    expect(result.current.index).toBe(1)
  })

  it('toggles mode with P without changing the step', () => {
    const { result } = setup(5, 'present')
    act(() => result.current.goTo(3))
    key('p')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(3)
    key('P')
    expect(result.current.mode).toBe('present')
  })

  it('leaves navigation keys to focused controls and ignores modifier combos', () => {
    const { result } = setup()
    act(() => result.current.goTo(2))
    const controls: Element[] = []
    for (const html of ['<button>b</button>', '<a href="#x">a</a>', '<input>', '<select><option>1</option></select>', '<textarea></textarea>', '<details><summary>s</summary></details>', '<div contenteditable="true">e</div>', '<div role="button" tabindex="0">r</div>']) {
      const host = document.createElement('div')
      host.innerHTML = html
      document.body.append(host)
      controls.push(host.querySelector('button, a, input, select, textarea, summary, [contenteditable], [role]')!)
    }
    for (const el of controls) {
      ;(el as HTMLElement).focus()
      for (const k of ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'p']) {
        const viaTarget = key(k, {}, el)
        expect(viaTarget.defaultPrevented, `${el.outerHTML} ${k}`).toBe(false)
        const viaDocument = key(k) // focus is still on the control
        expect(viaDocument.defaultPrevented).toBe(false)
      }
      expect(result.current.index).toBe(2)
      expect(result.current.mode).toBe('browse')
    }
    ;(document.activeElement as HTMLElement).blur()
    for (const mod of ['ctrlKey', 'metaKey', 'altKey']) {
      const e = key('ArrowRight', { [mod]: true })
      expect(e.defaultPrevented).toBe(false)
    }
    expect(result.current.index).toBe(2)
    key('ArrowRight', {}, document.body)
    expect(result.current.index).toBe(3)
    document.body.replaceChildren()
  })

  it('removes its listeners on unmount so remounts never double-handle', () => {
    const first = setup()
    first.unmount()
    const { result } = setup()
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const again = setup()
    again.unmount()
    expect(remove.mock.calls.map((c) => c[0]).sort()).toEqual(add.mock.calls.map((c) => c[0]).sort())
    add.mockRestore()
    remove.mockRestore()
  })

  it('handles each key once under StrictMode (balanced listeners)', () => {
    const { result } = setup(5, 'browse', ({ children }) => <StrictMode>{children}</StrictMode>)
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    key('ArrowRight')
    expect(result.current.index).toBe(2)
    swipe(-80)
    expect(result.current.index).toBe(3)
  })

  it('works inside a rendered component', () => {
    function Probe() {
      const nav = usePresentationNav(3)
      return <output>{nav.index}</output>
    }
    const { container } = render(<Probe />)
    key('ArrowRight')
    expect(container.textContent).toBe('1')
  })
})
