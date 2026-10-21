import { StrictMode } from 'react'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { swipeDirection } from '../swipe'
import { usePresentationNav } from '../usePresentationNav'

function key(k: string, init: KeyboardEventInit = {}, target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

function touch(type: 'touchstart' | 'touchend', x: number, y: number) {
  const event = new Event(type, { bubbles: true }) as Event & {
    touches: unknown[]
    changedTouches: unknown[]
  }
  const point = { clientX: x, clientY: y }
  event.touches = type === 'touchstart' ? [point] : []
  event.changedTouches = [point]
  act(() => {
    window.dispatchEvent(event)
  })
}

function swipe(dx: number, dy = 0) {
  touch('touchstart', 200, 200)
  touch('touchend', 200 + dx, 200 + dy)
}

function setup(count = 6, mode: 'browse' | 'present' = 'browse') {
  return renderHook(() => usePresentationNav(count, mode))
}

describe('keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step and suppresses the default', (k) => {
    const { result, rerender } = setup()
    rerender()
    const event = key(k)
    expect(result.current.index).toBe(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it.each(['ArrowLeft', 'PageUp'])('%j goes back exactly one step', (k) => {
    const { result } = setup()
    act(() => result.current.goTo(3))
    key(k)
    expect(result.current.index).toBe(2)
  })

  it('ignores unrelated keys', () => {
    const { result } = setup()
    const event = key('x')
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    expect(event.defaultPrevented).toBe(false)
  })

  it('P toggles the mode and keeps the position', () => {
    const { result } = setup(6)
    act(() => result.current.goTo(3))
    key('p')
    expect(result.current).toMatchObject({ mode: 'present', index: 3 })
    key('P')
    expect(result.current).toMatchObject({ mode: 'browse', index: 3 })
  })

  it('honors the initial mode', () => {
    expect(setup(3, 'present').result.current.mode).toBe('present')
  })

  it.each(['Control', 'Meta', 'Alt'] as const)('ignores keys with %s held', (mod) => {
    const { result } = setup()
    const flag = { Control: 'ctrlKey', Meta: 'metaKey', Alt: 'altKey' }[mod]
    key('ArrowRight', { [flag]: true })
    key('p', { [flag]: true })
    expect(result.current).toMatchObject({ index: 0, mode: 'browse' })
    key('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  describe('focused controls keep their keys', () => {
    const makers: Record<string, () => HTMLElement> = {
      button: () => document.createElement('button'),
      link: () => Object.assign(document.createElement('a'), { href: 'https://example.com/' }),
      input: () => document.createElement('input'),
      select: () => document.createElement('select'),
      textarea: () => document.createElement('textarea'),
      summary: () => document.createElement('summary'),
      contenteditable: () => {
        const el = document.createElement('div')
        el.setAttribute('contenteditable', 'true')
        return el
      },
    }
    for (const [name, make] of Object.entries(makers)) {
      for (const nested of [false, true]) {
        it(`${name}${nested ? ' (nested descendant)' : ''}`, () => {
          const { result } = setup()
          const control = make()
          const target = nested ? control.appendChild(document.createElement('span')) : control
          document.body.appendChild(control)
          for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
            const event = key(k, {}, target)
            expect(event.defaultPrevented).toBe(false)
          }
          expect(result.current).toMatchObject({ index: 0, mode: 'browse' })
          control.remove()
          key('ArrowRight')
          expect(result.current.index).toBe(1)
        })
      }
    }
  })
})

describe('boundaries', () => {
  it('clamps at the first step', () => {
    const { result } = setup()
    key('ArrowLeft')
    key('PageUp')
    act(() => result.current.prev())
    swipe(100)
    expect(result.current.index).toBe(0)
    key('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  it('clamps at the last step without wrapping', () => {
    const { result } = setup(3)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    key('ArrowRight')
    key(' ')
    act(() => result.current.next())
    swipe(-100)
    expect(result.current.index).toBe(2)
    key('ArrowLeft')
    expect(result.current.index).toBe(1)
  })

  it('stays put in a one-step presentation', () => {
    const { result } = setup(1)
    key('ArrowRight')
    key('ArrowLeft')
    expect(result.current.index).toBe(0)
  })
})

describe('touch swipe', () => {
  it('swiping left advances and right goes back', () => {
    const { result } = setup()
    swipe(-120)
    expect(result.current.index).toBe(1)
    swipe(120)
    expect(result.current.index).toBe(0)
  })

  it('needs at least 50px horizontally', () => {
    const { result } = setup()
    swipe(-49)
    expect(result.current.index).toBe(0)
    swipe(-50)
    expect(result.current.index).toBe(1)
  })

  it('ignores vertical-dominant and diagonal-equal movement', () => {
    const { result } = setup()
    swipe(-60, 90)
    swipe(-60, 60)
    expect(result.current.index).toBe(0)
  })

  it('navigates once per completed gesture', () => {
    const { result } = setup()
    touch('touchstart', 300, 100)
    touch('touchend', 200, 100)
    touch('touchend', 100, 100)
    expect(result.current.index).toBe(1)
  })

  it('classifies swipes', () => {
    expect(swipeDirection(-50, 0)).toBe(1)
    expect(swipeDirection(50, 0)).toBe(-1)
    expect(swipeDirection(49, 0)).toBe(0)
    expect(swipeDirection(60, -60)).toBe(0)
    expect(swipeDirection(0, 200)).toBe(0)
  })
})

describe('StrictMode', () => {
  it('one key press is one transition and listeners are removed on unmount', () => {
    const states: number[] = []
    function Probe() {
      const nav = usePresentationNav(10)
      states.push(nav.index)
      return <span data-testid="i">{nav.index}</span>
    }
    const { getByTestId, unmount } = render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    )
    key('ArrowRight')
    expect(getByTestId('i').textContent).toBe('1')
    key('PageDown')
    expect(getByTestId('i').textContent).toBe('2')
    unmount()
    const before = states.length
    key('ArrowRight')
    expect(states.length).toBe(before)
  })

  it('does not double-handle after a rerender', () => {
    const { result, rerender } = setup()
    rerender()
    rerender()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
  })
})
