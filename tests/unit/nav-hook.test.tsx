// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit'
import { key, swipe } from './helpers/fixtures'

const setup = (count = 5, start = 2) => {
  const hook = renderHook(() => usePresentationNav(count))
  act(() => hook.result.current.goTo(start))
  return hook
}

describe('usePresentationNav keyboard', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%j advances exactly one step', (k) => {
    const { result } = setup()
    act(() => void key(k))
    expect(result.current.index).toBe(3)
  })

  it.each([['ArrowLeft'], ['PageUp']])('%s goes back exactly one step', (k) => {
    const { result } = setup()
    act(() => void key(k))
    expect(result.current.index).toBe(1)
  })

  it('ignores unrelated keys and modified shortcuts', () => {
    const { result } = setup()
    for (const k of ['a', 'Enter', 'ArrowUp', 'Escape']) act(() => void key(k))
    act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true })))
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
  })

  it('P toggles browse and present without changing the step', () => {
    const { result } = setup()
    act(() => void key('p'))
    expect(result.current).toMatchObject({ mode: 'present', index: 2 })
    act(() => void key('P'))
    expect(result.current).toMatchObject({ mode: 'browse', index: 2 })
  })

  it('honors an initial mode', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'present'))
    expect(result.current.mode).toBe('present')
  })
})

describe('usePresentationNav touch', () => {
  it('left swipe advances and right swipe goes back', () => {
    const { result } = setup()
    act(() => swipe(-120))
    expect(result.current.index).toBe(3)
    act(() => swipe(120))
    expect(result.current.index).toBe(2)
  })

  it.each([
    ['vertical-dominant', 40, 200],
    ['short horizontal', 30, 0],
    ['diagonal with larger vertical travel', 80, 120],
    ['just below threshold', 49, 0],
  ])('does nothing for a %s gesture', (_, dx, dy) => {
    const { result } = setup()
    act(() => swipe(-dx, dy))
    act(() => swipe(dx, dy))
    expect(result.current.index).toBe(2)
  })

  it('treats exactly the threshold as a swipe', () => {
    const { result } = setup()
    act(() => swipe(-50))
    expect(result.current.index).toBe(3)
  })
})

describe('usePresentationNav controls keep their keys', () => {
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
    'nested descendant of a button': () => {
      const b = document.createElement('button')
      b.append(document.createElement('span'))
      document.body.append(b)
      return b.firstChild as HTMLElement
    },
  }

  it.each(Object.keys(makers))('%s receives navigation keys and P untouched', (name) => {
    const { result } = setup()
    const el = makers[name]()
    if (!el.isConnected) document.body.append(el)
    for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
      const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
      act(() => void el.dispatchEvent(event))
      expect(event.defaultPrevented).toBe(false)
    }
    expect(result.current).toMatchObject({ index: 2, mode: 'browse' })
    // navigation stays live on the body
    act(() => void key('ArrowRight'))
    expect(result.current.index).toBe(3)
  })
})

describe('usePresentationNav boundaries', () => {
  it('clamps at the start and at the end for keys, swipes and calls', () => {
    const { result } = setup(3, 0)
    act(() => void key('ArrowLeft'))
    act(() => swipe(120))
    act(() => result.current.prev())
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => void key('ArrowRight'))
    act(() => swipe(-120))
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('a single-step presentation never leaves step 0', () => {
    const { result } = setup(1, 0)
    act(() => void key('ArrowRight'))
    act(() => void key('ArrowLeft'))
    act(() => result.current.goTo(3))
    expect(result.current.index).toBe(0)
  })

  it('clamps when the step list shrinks', () => {
    const { result, rerender } = renderHook(({ n }) => usePresentationNav(n), { initialProps: { n: 5 } })
    act(() => result.current.goTo(4))
    rerender({ n: 2 })
    expect(result.current.index).toBe(1)
  })
})
