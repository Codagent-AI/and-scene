import { useCallback, useEffect, useState } from 'react'
import { clampIndex, isInteractiveTarget, keyAction, otherMode, swipeAction } from './nav'
import type { PresentationMode } from './types'

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(
  count: number,
  initialMode: PresentationMode = 'present',
): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(otherMode), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      const action = keyAction(e)
      if (!action) return
      e.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action === 'next') next()
      else if (action === 'prev') prev()
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

  return { index: clampIndex(index, count), mode, next, prev, goTo, toggleMode }
}
