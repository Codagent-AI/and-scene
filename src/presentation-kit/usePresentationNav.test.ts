import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from './usePresentationNav'

describe('usePresentationNav', () => {
  it('advances one step on ArrowRight', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(result.current.step).toBe(1)
  })

  it('goes back one step on ArrowLeft', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => {
      result.current.setStep(2)
    })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(result.current.step).toBe(1)
  })

  it('clamps at the first step when going back', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(result.current.step).toBe(0)
  })

  it('clamps at the last step when advancing', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => {
      result.current.setStep(2)
    })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(result.current.step).toBe(2)
  })

  it('toggles mode while preserving the current step', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'browse'))
    act(() => {
      result.current.setStep(1)
    })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
    })
    expect(result.current.mode).toBe('present')
    expect(result.current.step).toBe(1)
  })

  it('does not hijack navigation keys when focus is on a button', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      Object.defineProperty(event, 'target', { value: button })
      window.dispatchEvent(event)
    })

    expect(result.current.step).toBe(0)
    button.remove()
  })
})
