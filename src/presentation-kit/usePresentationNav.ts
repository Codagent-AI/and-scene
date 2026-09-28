import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

const SWIPE_THRESHOLD_PX = 40

const FOCUSED_CONTROL_SELECTOR =
  'button, a[href], input, textarea, select, [contenteditable], [role="button"]'

/** Interactive elements (or their descendants) that should keep their own key handling. */
function isFocusedControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return target.closest(FOCUSED_CONTROL_SELECTOR) !== null
}

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
  toggleMode: () => void
  touchHandlers: {
    onTouchStart: (event: React.TouchEvent) => void
    onTouchEnd: (event: React.TouchEvent) => void
  }
}

/**
 * Owns step index + mode state and wires keyboard, touch, and mode-toggle
 * navigation. Navigation clamps at [0, stepCount - 1] with no wrap-around.
 */
export function usePresentationNav({
  stepCount,
  initialMode = 'browse',
}: UsePresentationNavOptions): UsePresentationNavResult {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const clamp = useCallback(
    (candidate: number) => Math.min(Math.max(candidate, 0), Math.max(stepCount - 1, 0)),
    [stepCount],
  )

  const goTo = useCallback((candidate: number) => setIndex(clamp(candidate)), [clamp])
  const next = useCallback(() => setIndex((current) => clamp(current + 1)), [clamp])
  const prev = useCallback(() => setIndex((current) => clamp(current - 1)), [clamp])
  const toggleMode = useCallback(
    () => setMode((current) => (current === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isFocusedControl(event.target)) return
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

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const startX = touchStartX.current
      touchStartX.current = null
      if (startX === null) return
      const endX = event.changedTouches[0]?.clientX ?? startX
      const delta = endX - startX
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
      if (delta < 0) {
        next()
      } else {
        prev()
      }
    },
    [next, prev],
  )

  return {
    index,
    mode,
    next,
    prev,
    goTo,
    toggleMode,
    touchHandlers: { onTouchStart, onTouchEnd },
  }
}
