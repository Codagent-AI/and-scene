import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types.ts'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])
const SWIPE_MIN_PX = 50

const INTERACTIVE =
  'a,button,input,select,textarea,summary,[contenteditable=""],[contenteditable="true"],[role="button"],[role="link"],[role="textbox"],[role="tab"]'

/** Keys belong to a focused control (or anything inside one), not to the deck. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(0, count - 1)

  const goTo = useCallback((i: number) => setIndex(Math.min(Math.max(0, i), last)), [last])
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      if (isInteractiveTarget(e.target)) return
      if (NEXT_KEYS.has(e.key)) next()
      else if (PREV_KEYS.has(e.key)) prev()
      else if (e.key === 'p' || e.key === 'P') toggleMode()
      else return
      e.preventDefault()
    }
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 2) return
      if (dx < 0) next()
      else prev()
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
