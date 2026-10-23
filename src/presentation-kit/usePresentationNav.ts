import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_DISTANCE } from './constants.ts'
import { classifySwipe, clampIndex, isInteractiveTarget } from './nav.ts'
import type { Mode } from './types.ts'

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback(
    (target: number) => setIndex(clampIndex(target, count)),
    [count],
  )
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      if (NEXT_KEYS.has(e.key)) {
        e.preventDefault()
        next()
      } else if (PREV_KEYS.has(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === 'p' || e.key === 'P') {
        toggleMode()
      }
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const dir = classifySwipe(t.clientX - start.x, t.clientY - start.y, SWIPE_MIN_DISTANCE)
      start = null
      if (dir === 'next') next()
      else if (dir === 'prev') prev()
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

  return { index, mode, next, prev, goTo, toggleMode }
}
