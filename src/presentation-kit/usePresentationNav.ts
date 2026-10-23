import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_MODE, SWIPE_MIN_PX } from './constants'
import type { Mode } from './types'

const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"])'

/** Focused controls keep their keys; navigation only runs when the deck owns the event. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export interface PresentationNav {
  index: number
  mode: Mode
  goTo: (index: number) => void
  next: () => void
  prev: () => void
  toggleMode: () => void
}

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

/** Returns the swipe direction for a touch gesture: 1 = advance, -1 = go back, 0 = ignored. */
export function swipeDirection(dx: number, dy: number): number {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

export function usePresentationNav(count: number, initialMode: Mode = DEFAULT_MODE): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback((target: number) => setIndex(clampIndex(target, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isInteractiveTarget(event.target)) return
      let handled = true
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          prev()
          break
        case 'p':
        case 'P':
          toggleMode()
          break
        default:
          handled = false
      }
      if (handled) event.preventDefault()
    }

    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y)
      start = null
      if (direction > 0) next()
      if (direction < 0) prev()
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

  return { index: clampIndex(index, count), mode, goTo, next, prev, toggleMode }
}
