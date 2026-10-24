import { useCallback, useEffect, useState } from 'react'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction, type NavAction } from './navigation'
import type { Mode } from './types'

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

/** Step position and mode state plus keyboard and touch-swipe input. Clamps at both ends. */
export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'present' ? 'browse' : 'present')), [])

  useEffect(() => {
    const run = (action: NavAction | null) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else if (action === 'toggle-mode') toggleMode()
    }
    const onKey = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return
      const action = keyAction(event)
      if (!action) return
      event.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const t = event.touches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      if (!start || !t) return
      const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
      start = null
      run(action)
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

  return { index: clampIndex(index, count), mode, next, prev, goTo, toggleMode }
}
