import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../../../src/presentation-kit/usePresentationNav'
import { press } from '../../helpers'

function setup(count = 3, initialMode: 'browse' | 'present' = 'browse') {
  return renderHook(() => usePresentationNav({ count, initialMode }))
}

describe('usePresentationNav', () => {
  it('starts on the first step in the requested mode', () => {
    const { result } = setup(3, 'present')
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
  })

  it('clamps next and prev at both ends without wrapping', () => {
    const { result } = setup(3)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('clamps direct jumps', () => {
    const { result } = setup(3)
    act(() => result.current.goTo(9))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it.each(['ArrowRight', ' ', 'PageDown'])('advances on %j', (key) => {
    const { result } = setup(3)
    press(key)
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowLeft', 'PageUp'])('goes back on %j', (key) => {
    const { result } = setup(3)
    act(() => result.current.goTo(2))
    press(key)
    expect(result.current.index).toBe(1)
  })

  it('toggles mode with P while keeping the current step', () => {
    const { result } = setup(3)
    act(() => result.current.goTo(1))
    press('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
    press('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
  })

  it('does not hijack keys pressed while an interactive control has focus', () => {
    const { result } = setup(3)
    const button = document.createElement('button')
    document.body.append(button)

    press('ArrowRight', button)
    press('p', button)
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')

    button.remove()
  })

  it('ignores keys with command or control modifiers', () => {
    const { result } = setup(3)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }))
    })
    expect(result.current.index).toBe(0)
  })
})
