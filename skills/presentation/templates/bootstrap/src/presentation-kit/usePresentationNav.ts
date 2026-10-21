import { useCallback, useEffect, useState } from 'react'
import { isInteractiveTarget } from './interactive'
import { swipeDirection } from './swipe'
import type { Mode } from './types'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'Spacebar', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

/** Step + mode state with keyboard and touch-swipe navigation, clamped at both ends. */
export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [state, setState] = useState({ index: 0, mode: initialMode })
  const last = Math.max(0, count - 1)
  const clamp = useCallback((i: number) => Math.min(last, Math.max(0, i)), [last])

  const goTo = useCallback(
    (i: number) => setState((s) => ({ ...s, index: clamp(i) })),
    [clamp],
  )
  const next = useCallback(
    () => setState((s) => ({ ...s, index: clamp(s.index + 1) })),
    [clamp],
  )
  const prev = useCallback(
    () => setState((s) => ({ ...s, index: clamp(s.index - 1) })),
    [clamp],
  )
  const toggleMode = useCallback(
    () => setState((s) => ({ ...s, mode: s.mode === 'browse' ? 'present' : 'browse' })),
    [],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      if (NEXT_KEYS.has(event.key)) next()
      else if (PREV_KEYS.has(event.key)) prev()
      else if (event.key === 'p' || event.key === 'P') toggleMode()
      else return
      event.preventDefault()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0] ?? event.changedTouches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y)
      start = null
      if (direction === 1) next()
      else if (direction === -1) prev()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index: clamp(state.index), mode: state.mode, next, prev, goTo, toggleMode }
}
