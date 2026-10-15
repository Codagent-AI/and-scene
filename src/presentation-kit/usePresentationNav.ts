import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './constants'
import { clampIndex, isInteractiveTarget, keyToAction, swipeToAction, type NavAction } from './navLogic'

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const run = (action: NavAction | null) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else if (action === 'toggle-mode') toggleMode()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      const action = keyToAction(e.key)
      if (!action) return
      e.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      run(swipeToAction(t.clientX - start.x, t.clientY - start.y))
      start = null
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

  return { index, mode, next, prev, goTo, toggleMode, setMode }
}
