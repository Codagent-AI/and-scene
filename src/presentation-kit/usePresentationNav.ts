import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN_DISTANCE, type PresentationMode } from './constants'

const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable=""], [contenteditable="true"]'

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

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
  const last = Math.max(0, count - 1)
  // Normalize stored state when the step count shrinks.
  if (index > last) setIndex(last)

  const goTo = useCallback(
    (i: number) => setIndex(Math.min(last, Math.max(0, i))),
    [last],
  )
  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])
  const prev = useCallback(
    () => setIndex((i) => Math.max(0, Math.min(i, last) - 1)),
    [last],
  )
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isInteractive(e.target)) return
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          prev()
          break
        case 'p':
        case 'P':
          toggleMode()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchStart.current = null
      if (e.defaultPrevented || isInteractive(e.target)) return
      if (e.touches && e.touches.length > 1) return
      const t = e.changedTouches[0]
      if (t) touchStart.current = { x: t.clientX, y: t.clientY }
    }
    const onCancel = () => {
      touchStart.current = null
    }
    const onEnd = (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [next, prev])

  return { index: Math.min(index, last), mode, next, prev, goTo, toggleMode }
}
