import { useCallback, useEffect, useState } from 'react'
import { clampIndex, keyAction, swipeAction } from './navigation'
import type { Mode } from './types'

export interface PresentationNav {
  index: number
  mode: Mode
  next(): void
  prev(): void
  goTo(index: number): void
  toggleMode(): void
}

interface NavState {
  index: number
  mode: Mode
}

export function usePresentationNav(count: number, initialMode: Mode = 'present'): PresentationNav {
  const [state, setState] = useState<NavState>({ index: 0, mode: initialMode })
  const index = clampIndex(state.index, count)

  const goTo = useCallback(
    (target: number) =>
      setState((s) => ({ ...s, index: clampIndex(target, count) })),
    [count],
  )
  const next = useCallback(
    () => setState((s) => ({ ...s, index: clampIndex(clampIndex(s.index, count) + 1, count) })),
    [count],
  )
  const prev = useCallback(
    () => setState((s) => ({ ...s, index: clampIndex(clampIndex(s.index, count) - 1, count) })),
    [count],
  )
  const toggleMode = useCallback(
    () => setState((s) => ({ ...s, mode: s.mode === 'present' ? 'browse' : 'present' })),
    [],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = keyAction(event)
      if (!action) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const origin = start
      start = null
      if (!origin || !touch) return
      const action = swipeAction(touch.clientX - origin.x, touch.clientY - origin.y)
      if (action === 'next') next()
      else if (action === 'prev') prev()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode: state.mode, next, prev, goTo, toggleMode }
}
