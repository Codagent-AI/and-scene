import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { SWIPE_MIN_PX } from './constants'
import type { Mode } from './types'

export const clampIndex = (index: number, count: number) =>
  Math.min(Math.max(index, 0), Math.max(count - 1, 0))

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="tab"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

/** +1 for a left swipe, -1 for a right swipe, 0 when the gesture is not a horizontal swipe. */
export function swipeDelta(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

const KEY_DELTA: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ' ': 1,
  PageDown: 1,
  ArrowLeft: -1,
  PageUp: -1,
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const goTo = useCallback(
    (target: number) => setIndex(clampIndex(target, count)),
    [count],
  )
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isInteractiveTarget(e.target)) return
      if (e.key.toLowerCase() === 'p') {
        toggleMode()
        return
      }
      const delta = KEY_DELTA[e.key]
      if (!delta) return
      e.preventDefault()
      setIndex((i) => clampIndex(i + delta, count))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [count, toggleMode])

  const touchHandlers = {
    onTouchStart: (e: TouchEvent) => {
      const t = e.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    },
    onTouchEnd: (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const delta = swipeDelta(t.clientX - start.x, t.clientY - start.y)
      if (delta) setIndex((i) => clampIndex(i + delta, count))
    },
  }

  return { index: clampIndex(index, count), mode, goTo, next, prev, toggleMode, touchHandlers }
}
