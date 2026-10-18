import { StrictMode, useEffect } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav, type PresentationNav } from './usePresentationNav'
import type { Mode } from './types'

function Probe({ count, mode, onNav }: { count: number; mode: Mode; onNav: (nav: PresentationNav) => void }) {
  const nav = usePresentationNav(count, mode)
  useEffect(() => onNav(nav))
  return (
    <div>
      <span data-testid="state">{`${nav.index}:${nav.mode}`}</span>
      <button data-testid="btn">b</button>
      <input data-testid="input" />
      <a href="#x" data-testid="link">
        l
      </a>
      <div data-testid="plain" />
    </div>
  )
}

function setup(count = 5, mode: Mode = 'present', strict = false) {
  const out: { nav?: PresentationNav } = {}
  const onNav = (nav: PresentationNav) => {
    out.nav = nav
  }
  const tree = <Probe count={count} mode={mode} onNav={onNav} />
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  const state = () => view.getByTestId('state').textContent
  return { out, view, state, onNav }
}

const press = (key: string, target: Element | Window = window, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key, ...init })

describe('usePresentationNav', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (key) => {
    const { state } = setup()
    press(key)
    expect(state()).toBe('1:present')
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (key) => {
    const { state, out } = setup()
    act(() => out.nav!.goTo(3))
    press(key)
    expect(state()).toBe('2:present')
  })

  it('advances once per key under StrictMode (no duplicate listeners)', () => {
    const { state, view } = setup(5, 'present', true)
    press('ArrowRight', view.getByTestId('plain'))
    press('ArrowRight')
    expect(state()).toBe('2:present')
  })

  it('does not stack listeners across rerenders', () => {
    const { state, view, onNav } = setup()
    view.rerender(<Probe count={5} mode="present" onNav={onNav} />)
    view.rerender(<Probe count={5} mode="present" onNav={onNav} />)
    press('ArrowRight')
    expect(state()).toBe('1:present')
  })

  it('removes its listeners on unmount', () => {
    const { view, out } = setup()
    view.unmount()
    press('ArrowRight')
    expect(out.nav!.index).toBe(0)
  })

  it('clamps at both ends for keys and methods', () => {
    const { state, out } = setup(3)
    press('ArrowLeft')
    act(() => out.nav!.prev())
    expect(state()).toBe('0:present')
    act(() => out.nav!.goTo(99))
    expect(state()).toBe('2:present')
    press('ArrowRight')
    act(() => out.nav!.next())
    expect(state()).toBe('2:present')
    act(() => out.nav!.goTo(-4))
    expect(state()).toBe('0:present')
  })

  it('toggles mode with P and keeps the step', () => {
    const { state, out } = setup()
    act(() => out.nav!.goTo(2))
    press('p')
    expect(state()).toBe('2:browse')
    press('P')
    expect(state()).toBe('2:present')
  })

  it('swipes left to advance and right to go back, ignoring weak or vertical moves', () => {
    const { state } = setup()
    const swipe = (dx: number, dy = 0) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: 300, clientY: 300 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 300 + dx, clientY: 300 + dy }] })
    }
    swipe(-80)
    expect(state()).toBe('1:present')
    swipe(-30)
    swipe(-60, 100)
    expect(state()).toBe('1:present')
    swipe(90)
    expect(state()).toBe('0:present')
  })

  it('lets interactive controls keep their keys', () => {
    const { state, view } = setup()
    for (const id of ['btn', 'input', 'link'])
      for (const key of ['ArrowRight', ' ', 'PageDown', 'p']) {
        const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        view.getByTestId(id).dispatchEvent(ev)
        expect(ev.defaultPrevented, `${id} ${key}`).toBe(false)
      }
    expect(state()).toBe('0:present')
    press('ArrowRight', view.getByTestId('plain'))
    expect(state()).toBe('1:present')
  })

  it('ignores modifier combinations', () => {
    const { state } = setup()
    press('ArrowRight', window, { ctrlKey: true })
    press('ArrowRight', window, { metaKey: true })
    press('ArrowRight', window, { altKey: true })
    expect(state()).toBe('0:present')
  })

  it('prevents default scrolling for handled keys', () => {
    setup()
    const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    window.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })
})
