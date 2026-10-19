import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { Presentation, usePresentationNav, type Step } from './index'

afterEach(cleanup)

describe('navigation robustness', () => {
  it('ignores auto-repeated and already-handled key events', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    fireEvent.keyDown(document.body, { key: 'ArrowRight', repeat: true })
    fireEvent.keyDown(document.body, { key: 'p', repeat: true })
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true })
    handled.preventDefault()
    act(() => {
      window.dispatchEvent(handled)
    })
    expect(result.current.index).toBe(0)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
  })

  it('does not restore a stale larger index when the step count shrinks and grows back', () => {
    const { result, rerender } = renderHook(({ n }) => usePresentationNav(n, 'present'), { initialProps: { n: 5 } })
    act(() => result.current.goTo(4))
    expect(result.current.index).toBe(4)
    rerender({ n: 2 })
    expect(result.current.index).toBe(1)
    rerender({ n: 5 })
    expect(result.current.index).toBe(1)
  })

  it('fails with a clear error for a presentation without steps', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const empty: Step<number>[] = []
    expect(() => render(<Presentation steps={empty} title="none" />)).toThrow('at least one step')
    spy.mockRestore()
  })
})
