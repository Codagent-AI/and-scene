import { StrictMode } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav.ts'
import { Demo } from './helpers.tsx'

const key = (k: string, init: KeyboardEventInit = {}, target: Element | Window = window) =>
  act(() => {
    fireEvent.keyDown(target, { key: k, ...init })
  })

function setup(count = 5, mode: 'browse' | 'present' = 'browse') {
  return renderHook(() => usePresentationNav(count, mode))
}

function swipe(dx: number, dy = 0, target: Element | Window = window) {
  act(() => {
    fireEvent.touchStart(target, { touches: [{ clientX: 200, clientY: 200 }] })
    fireEvent.touchEnd(target, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] })
  })
}

describe('keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%s advances exactly one step', (k) => {
    const { result } = setup()
    key(k)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (k) => {
    const { result } = setup()
    act(() => result.current.goTo(3))
    key(k)
    expect(result.current.index).toBe(2)
  })

  it('honors initialMode for both modes and toggles with P in each direction keeping the step', () => {
    const present = setup(5, 'present')
    expect(present.result.current.mode).toBe('present')
    present.unmount()
    const browse = setup(5, 'browse')
    expect(browse.result.current.mode).toBe('browse')
    act(() => browse.result.current.goTo(2))
    key('p')
    expect(browse.result.current.mode).toBe('present')
    expect(browse.result.current.index).toBe(2)
    key('P')
    expect(browse.result.current.mode).toBe('browse')
    expect(browse.result.current.index).toBe(2)
  })
})

describe('boundaries', () => {
  it('clamps at the start and the end without wrapping, repeatedly', () => {
    const { result } = setup(3)
    key('ArrowLeft')
    key('PageUp')
    swipe(100)
    expect(result.current.index).toBe(0)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    for (let i = 0; i < 6; i++) key('ArrowRight')
    expect(result.current.index).toBe(2)
    swipe(-100)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('clamps the rendered controls at both ends', () => {
    render(<Demo />)
    expect((screen.getByLabelText('Previous step') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByLabelText('Next step'))
    expect((screen.getByLabelText('Next step') as HTMLButtonElement).disabled).toBe(true)
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('4')
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('4')
  })
})

describe('touch swipe', () => {
  it('left advances and right goes back, one step each', () => {
    const { result } = setup()
    swipe(-120)
    expect(result.current.index).toBe(1)
    swipe(120)
    expect(result.current.index).toBe(0)
  })

  it('ignores short and predominantly vertical gestures', () => {
    const { result } = setup()
    swipe(-20)
    swipe(-120, 200)
    swipe(120, -130)
    expect(result.current.index).toBe(0)
  })

  it('ignores gestures that start on an interactive control', () => {
    const { result } = setup()
    const button = document.body.appendChild(document.createElement('button'))
    swipe(-120, 0, button)
    expect(result.current.index).toBe(0)
    button.remove()
  })
})

describe('focused controls keep their keys', () => {
  const makers: Record<string, () => HTMLElement> = {
    button: () => document.createElement('button'),
    link: () => Object.assign(document.createElement('a'), { href: '#x' }),
    input: () => document.createElement('input'),
    select: () => document.createElement('select'),
    textarea: () => document.createElement('textarea'),
    summary: () => document.createElement('summary'),
    contenteditable: () => {
      const el = document.createElement('div')
      el.setAttribute('contenteditable', 'true')
      return el
    },
    'aria role': () => {
      const el = document.createElement('div')
      el.setAttribute('role', 'slider')
      return el
    },
    'descendant of a control': () => {
      const outer = document.createElement('button')
      outer.appendChild(document.createElement('span'))
      return outer.firstElementChild as HTMLElement
    },
  }

  it.each(Object.keys(makers))('%s: keys neither navigate nor toggle nor are prevented', (name) => {
    const { result } = setup()
    const el = makers[name]()
    const host = el.parentElement ?? el
    document.body.appendChild(host)
    for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'p']) {
      const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
      act(() => {
        el.dispatchEvent(event)
      })
      expect(event.defaultPrevented).toBe(false)
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    host.remove()
  })

  it('uses the focused element even when the event target is the body', () => {
    const { result } = setup()
    const input = document.body.appendChild(document.createElement('input'))
    input.focus()
    key('ArrowRight')
    expect(result.current.index).toBe(0)
    input.remove()
  })

  it('navigates from non-interactive targets and prevents the default scroll', () => {
    const { result } = setup()
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    act(() => {
      document.body.dispatchEvent(event)
    })
    expect(result.current.index).toBe(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('ignores Ctrl/Meta/Alt chords and events that are already defaultPrevented', () => {
    const { result } = setup()
    key('ArrowRight', { ctrlKey: true })
    key('ArrowRight', { metaKey: true })
    key('ArrowRight', { altKey: true })
    key('p', { ctrlKey: true })
    const prevented = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    prevented.preventDefault()
    act(() => {
      window.dispatchEvent(prevented)
    })
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
  })
})

describe('StrictMode effect replay', () => {
  it('moves one step per key event and removes listeners on unmount', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(5), { wrapper: StrictMode })
    key('ArrowRight')
    expect(result.current.index).toBe(1)
    swipe(-100)
    expect(result.current.index).toBe(2)
    unmount()
    key('ArrowRight')
    expect(result.current.index).toBe(2)
  })

  it('registers exactly one live keydown listener after replay', () => {
    const add = window.addEventListener.bind(window)
    const live = new Set<EventListenerOrEventListenerObject>()
    const addSpy = (type: string, listener: EventListenerOrEventListenerObject, opts?: unknown) => {
      if (type === 'keydown') live.add(listener)
      add(type, listener, opts as AddEventListenerOptions)
    }
    const remove = window.removeEventListener.bind(window)
    const removeSpy = (type: string, listener: EventListenerOrEventListenerObject, opts?: unknown) => {
      if (type === 'keydown') live.delete(listener)
      remove(type, listener, opts as EventListenerOptions)
    }
    window.addEventListener = addSpy as typeof window.addEventListener
    window.removeEventListener = removeSpy as typeof window.removeEventListener
    try {
      const { unmount } = renderHook(() => usePresentationNav(3), { wrapper: StrictMode })
      expect(live.size).toBe(1)
      unmount()
      expect(live.size).toBe(0)
    } finally {
      window.addEventListener = add
      window.removeEventListener = remove
    }
  })
})
