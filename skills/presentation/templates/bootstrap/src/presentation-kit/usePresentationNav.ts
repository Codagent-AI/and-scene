import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { actionForKey, actionForSwipe, clampIndex } from './nav.ts'
import type { Mode } from './types.ts'

/** Step index + mode state with keyboard, touch, and clamped navigation. */
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = actionForKey(event)
      if (!action) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swipe = {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    },
    onTouchEnd: (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const action = actionForSwipe(t.clientX - start.x, t.clientY - start.y)
      if (action === 'next') next()
      else if (action === 'prev') prev()
    },
  }

  return { index, mode, goTo, next, prev, toggleMode, swipe }
}
