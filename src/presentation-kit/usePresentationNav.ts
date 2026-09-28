import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { isFocusedFormControl } from './dom'
import type { PresentationMode } from './types'

export interface UsePresentationNavOptions {
  stepCount: number
  initialMode?: PresentationMode
  initialStepIndex?: number
}

export interface UsePresentationNavResult {
  stepIndex: number
  mode: PresentationMode
  atStart: boolean
  atEnd: boolean
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  setMode: (mode: PresentationMode) => void
  swipeHandlers: {
    onTouchStart: (event: ReactTouchEvent) => void
    onTouchEnd: (event: ReactTouchEvent) => void
  }
}

const SWIPE_THRESHOLD = 40

export function usePresentationNav({
  stepCount,
  initialMode = 'browse',
  initialStepIndex = 0,
}: UsePresentationNavOptions): UsePresentationNavResult {
  const clamp = useCallback(
    (index: number) => Math.min(Math.max(index, 0), Math.max(stepCount - 1, 0)),
    [stepCount],
  )

  const [stepIndex, setStepIndex] = useState(() => clamp(initialStepIndex))
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback(
    (index: number) => {
      setStepIndex(clamp(index))
    },
    [clamp],
  )

  const next = useCallback(() => {
    setStepIndex((current) => clamp(current + 1))
  }, [clamp])

  const prev = useCallback(() => {
    setStepIndex((current) => clamp(current - 1))
  }, [clamp])

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'present' ? 'browse' : 'present'))
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isFocusedFormControl()) return
      if (event.key === ' ' && event.target instanceof Element && event.target.closest('button, [role="button"]')) {
        return
      }

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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev, toggleMode])

  const onTouchStart = useCallback((event: ReactTouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])

  const onTouchEnd = useCallback(
    (event: ReactTouchEvent) => {
      const startX = touchStartX.current
      touchStartX.current = null
      if (startX === null) return

      const endX = event.changedTouches[0]?.clientX ?? startX
      const deltaX = endX - startX
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

      if (deltaX < 0) {
        next()
      } else {
        prev()
      }
    },
    [next, prev],
  )

  const clampedStepIndex = clamp(stepIndex)

  return {
    stepIndex: clampedStepIndex,
    mode,
    atStart: clampedStepIndex <= 0,
    atEnd: clampedStepIndex >= stepCount - 1,
    next,
    prev,
    goTo,
    toggleMode,
    setMode,
    swipeHandlers: { onTouchStart, onTouchEnd },
  }
}
