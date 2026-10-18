import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_PX, type Mode } from './constants'
import { isInteractive } from './interactive'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

/** Keyboard, touch and programmatic navigation. Clamps at both ends; never wraps. */
export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(0, count - 1)
  // The step list can shrink under a mounted deck; never point past its end.
  const index = Math.min(rawIndex, last)

  const goTo = useCallback((i: number) => setIndex(Math.min(last, Math.max(0, i))), [last])
  // Step from the displayed index, which is clamped when the step list has shrunk.
  const next = useCallback(() => setIndex((i) => Math.min(last, Math.min(i, last) + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, Math.min(i, last) - 1)), [last])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isInteractive(e.target as Element | null) || isInteractive(document.activeElement)) return
      if (NEXT_KEYS.has(e.key)) next()
      else if (PREV_KEYS.has(e.key)) prev()
      else if (e.key === 'p' || e.key === 'P') toggleMode()
      else return
      e.preventDefault()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const from = start
      start = null
      if (!from || !t) return
      const dx = t.clientX - from.x
      const dy = t.clientY - from.y
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
    }
    const onTouchCancel = () => {
      start = null
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, toggleMode }
}
