import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import type { PresentationMode } from './types'

export interface UsePresentationNavOptions {
  stepCount: number
  initialMode?: PresentationMode
}

export interface UsePresentationNavResult {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: PresentationMode) => void
  toggleMode: () => void
  isFirst: boolean
  isLast: boolean
  touchHandlers: {
    onTouchStart: (event: ReactTouchEvent) => void
    onTouchEnd: (event: ReactTouchEvent) => void
  }
}

const INTERACTIVE_SELECTOR = 'input, textarea, select, button, a[href], [contenteditable="true"]'
const SWIPE_THRESHOLD = 40

/**
 * Keyboard, touch, and mode-toggle navigation for a presentation. Clamps at
 * `[0, stepCount - 1]` with no wrap-around and defers to focused interactive
 * controls instead of hijacking their keys.
 */
export function usePresentationNav({
  stepCount,
  initialMode = 'present',
}: UsePresentationNavOptions): UsePresentationNavResult {
  const [rawIndex, setRawIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const clamp = useCallback(
    (value: number) => Math.min(Math.max(value, 0), Math.max(stepCount - 1, 0)),
    [stepCount],
  )

  const index = clamp(rawIndex)

  const goTo = useCallback((value: number) => setRawIndex(clamp(value)), [clamp])
  const next = useCallback(() => setRawIndex((current) => clamp(current) + 1), [clamp])
  const prev = useCallback(() => setRawIndex((current) => clamp(current) - 1), [clamp])
  const toggleMode = useCallback(
    () => setMode((current) => (current === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && target.closest(INTERACTIVE_SELECTOR)) return

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          event.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          prev()
          break
        case 'p':
        case 'P':
          toggleMode()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const onTouchStart = useCallback((event: ReactTouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])

  const onTouchEnd = useCallback(
    (event: ReactTouchEvent) => {
      const startX = touchStartX.current
      touchStartX.current = null
      if (startX == null) return
      const endX = event.changedTouches[0]?.clientX ?? startX
      const delta = endX - startX
      if (Math.abs(delta) < SWIPE_THRESHOLD) return
      if (delta < 0) next()
      else prev()
    },
    [next, prev],
  )

  return {
    index,
    mode,
    next,
    prev,
    goTo,
    setMode,
    toggleMode,
    isFirst: index === 0,
    isLast: index === Math.max(stepCount - 1, 0),
    touchHandlers: { onTouchStart, onTouchEnd },
  }
}
