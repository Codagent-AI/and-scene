import { useCallback, useEffect, useState } from 'react'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction } from './nav.ts'
import type { Mode } from './types.ts'

/** Step index and mode state plus keyboard and touch navigation. */
export function usePresentationNav(count: number, initialMode: Mode = 'browse', initialIndex = 0) {
  const [rawIndex, setIndex] = useState(() => clampIndex(initialIndex, count))
  const [mode, setMode] = useState<Mode>(initialMode)
  // Steps may shrink while mounted; never point past the end.
  const index = clampIndex(rawIndex, count)

  const next = useCallback(() => setIndex((i) => clampIndex(clampIndex(i, count) + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(clampIndex(i, count) - 1, count)), [count])
  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      const action = keyAction(e.key)
      if (!action) return
      e.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    let start: { x: number; y: number } | null = null
    const onStart = (e: TouchEvent) => {
      const t = e.touches.length === 1 ? e.touches[0] : null
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const from = start
      start = null
      if (!from || !t) return
      const action = swipeAction(t.clientX - from.x, t.clientY - from.y)
      if (action === 'next') next()
      else if (action === 'prev') prev()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, setMode, toggleMode }
}
