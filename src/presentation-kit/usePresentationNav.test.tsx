import { describe, expect, it } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { usePresentationNav } from './usePresentationNav'

describe('usePresentationNav', () => {
  it('advances and retreats on keyboard input', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))

    await act(async () => {
      await user.keyboard('{ArrowRight}')
    })
    expect(result.current.index).toBe(1)

    await act(async () => {
      await user.keyboard(' ')
    })
    expect(result.current.index).toBe(2)

    await act(async () => {
      await user.keyboard('{ArrowLeft}')
    })
    expect(result.current.index).toBe(1)
  })

  it('clamps at the start and end with no wrap-around', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => usePresentationNav({ stepCount: 2 }))

    await act(async () => {
      await user.keyboard('{ArrowLeft}')
    })
    expect(result.current.index).toBe(0)

    await act(async () => {
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    })
    expect(result.current.index).toBe(1)
  })

  it('toggles mode with P while preserving the current step', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3, initialMode: 'present' }))

    await act(async () => {
      await user.keyboard('{ArrowRight}')
    })
    expect(result.current.index).toBe(1)

    await act(async () => {
      await user.keyboard('p')
    })
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
  })

  it('does not hijack keys when focus is on an interactive control', async () => {
    const user = userEvent.setup()

    function Harness() {
      const nav = usePresentationNav({ stepCount: 3 })
      return (
        <div>
          <span data-testid="index">{nav.index}</span>
          <input aria-label="note" />
        </div>
      )
    }

    render(<Harness />)
    await user.click(screen.getByLabelText('note'))
    await user.keyboard('{ArrowRight}')

    expect(screen.getByTestId('index').textContent).toBe('0')
  })

  it('advances on left swipe and retreats on right swipe', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))

    act(() => {
      result.current.touchHandlers.onTouchStart({
        touches: [{ clientX: 200 }],
      } as unknown as ReactTouchEvent)
      result.current.touchHandlers.onTouchEnd({
        changedTouches: [{ clientX: 100 }],
      } as unknown as ReactTouchEvent)
    })
    expect(result.current.index).toBe(1)

    act(() => {
      result.current.touchHandlers.onTouchStart({
        touches: [{ clientX: 100 }],
      } as unknown as ReactTouchEvent)
      result.current.touchHandlers.onTouchEnd({
        changedTouches: [{ clientX: 200 }],
      } as unknown as ReactTouchEvent)
    })
    expect(result.current.index).toBe(0)
  })

  it('jumps directly to a step via goTo, clamped to bounds', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))

    act(() => result.current.goTo(3))
    expect(result.current.index).toBe(3)

    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(4)
  })
})
