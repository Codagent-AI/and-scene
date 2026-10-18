import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN_PX, type Mode } from './constants'

const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="tab"], [role="menuitem"]'

export const clampIndex = (index: number, count: number): number =>
  Math.max(0, Math.min(count - 1, index))

/** +1 advances (swipe left), -1 goes back (swipe right), 0 ignores the gesture. */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface NavOptions {
  initialMode?: Mode
  initialIndex?: number
}

export function usePresentationNav(count: number, options: NavOptions = {}) {
  const [rawIndex, setIndex] = useState(options.initialIndex ?? 0)
  const [mode, setMode] = useState<Mode>(options.initialMode ?? 'browse')
  const countRef = useRef(count)
  useEffect(() => {
    countRef.current = count
  }, [count])
  const index = clampIndex(rawIndex, count)

  const goTo = useCallback(
    (target: number) => setIndex(clampIndex(target, countRef.current)),
    [],
  )
  const move = useCallback(
    (delta: number) => setIndex((i) => clampIndex(clampIndex(i, countRef.current) + delta, countRef.current)),
    [],
  )
  const next = useCallback(() => move(1), [move])
  const prev = useCallback(() => move(-1), [move])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
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
          return
      }
      event.preventDefault()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const delta = swipeStep(touch.clientX - start.x, touch.clientY - start.y)
      start = null
      if (delta !== 0) move(delta)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, move, toggleMode])

  return { index, mode, goTo, next, prev, toggleMode }
}
