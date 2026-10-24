import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePresentationNav } from '../../src/presentation-kit'

const press = (key: string, target: EventTarget = window) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })

const touch = (type: 'touchstart' | 'touchend', x: number, y = 0) =>
  act(() => {
    const t = { clientX: x, clientY: y } as Touch
    const ev = new Event(type, { bubbles: true }) as TouchEvent
    Object.defineProperty(ev, type === 'touchstart' ? 'touches' : 'changedTouches', { value: [t] })
    window.dispatchEvent(ev)
  })

describe('usePresentationNav', () => {
  it('advances with Right, Space and PageDown and goes back with Left and PageUp', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(result.current.index).toBe(3)
    press('ArrowLeft')
    press('PageUp')
    expect(result.current.index).toBe(1)
  })

  it('clamps at the start and at the end', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    press('ArrowLeft')
    expect(result.current.index).toBe(0)
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    press('PageDown')
    expect(result.current.index).toBe(2)
  })

  it('swipes left to advance and right to go back', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    touch('touchstart', 300)
    touch('touchend', 100)
    expect(result.current.index).toBe(1)
    touch('touchstart', 100)
    touch('touchend', 300)
    expect(result.current.index).toBe(0)
  })

  it('toggles mode with P while keeping the step, and honors the initial mode', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    expect(result.current.mode).toBe('present')
    press('ArrowRight')
    press('p')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
    press('P')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
  })

  it('does not hijack keys while a control is focused', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const button = document.createElement('button')
    document.body.appendChild(button)
    press(' ', button)
    press('ArrowRight', button)
    expect(result.current.index).toBe(0)
    button.remove()
  })

  it('jumps directly to a step and clamps out-of-range jumps', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    act(() => result.current.goTo(2))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(3)
  })
})
