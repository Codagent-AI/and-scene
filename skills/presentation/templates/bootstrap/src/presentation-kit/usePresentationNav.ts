import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
import { NEXT_KEYS, PREV_KEYS, clamp, isInteractive, swipeDirection } from './nav'

export function usePresentationNav(count: number, initialMode: Mode = 'present') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const go = useCallback((i: number) => setIndex(clamp(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clamp(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'present' ? 'browse' : 'present')), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isInteractive(e.target)) return
      if (NEXT_KEYS.includes(e.key)) next()
      else if (PREV_KEYS.includes(e.key)) prev()
      else if (e.key === 'p' || e.key === 'P') toggleMode()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!s || !t) return
      const dir = swipeDirection(t.clientX - s.x, t.clientY - s.y)
      if (dir === 1) next()
      else if (dir === -1) prev()
    },
  }

  return { index: clamp(index, count), mode, go, next, prev, toggleMode, touchHandlers }
}
