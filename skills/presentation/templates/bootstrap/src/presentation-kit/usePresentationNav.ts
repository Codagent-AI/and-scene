import { useCallback, useEffect, useState } from 'react'
import { isInteractive } from './interactive'
import { NEXT_KEYS, PREV_KEYS, clampIndex, swipeDirection } from './navigation'
import type { Mode } from './types'

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      if (isInteractive(e.target)) return
      if (NEXT_KEYS.includes(e.key)) next()
      else if (PREV_KEYS.includes(e.key)) prev()
      else if (e.key === 'p' || e.key === 'P') toggleMode()
      else return
      e.preventDefault()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const dir = swipeDirection(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (dir === 1) next()
      else if (dir === -1) prev()
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

  return { index: clampIndex(index, count), mode, goTo, next, prev, toggleMode, setMode }
}
