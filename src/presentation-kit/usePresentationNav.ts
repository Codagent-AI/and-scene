import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_THRESHOLD } from './constants'
import type { Mode } from './types'

export interface PresentationNav {
  stepIndex: number
  mode: Mode
  stepCount: number
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  setMode: (mode: Mode) => void
}

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'])

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return INTERACTIVE_TAGS.has(target.tagName)
}

function clampIndex(index: number, stepCount: number): number {
  if (stepCount <= 0) return 0
  return Math.min(Math.max(index, 0), stepCount - 1)
}

export function usePresentationNav(stepCount: number, initialMode: Mode = 'browse'): PresentationNav {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback((index: number) => {
    setStepIndex(clampIndex(index, stepCount))
  }, [stepCount])

  const next = useCallback(() => {
    setStepIndex((current) => clampIndex(current + 1, stepCount))
  }, [stepCount])

  const prev = useCallback(() => {
    setStepIndex((current) => clampIndex(current - 1, stepCount))
  }, [stepCount])

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'present' ? 'browse' : 'present'))
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isInteractiveTarget(event.target)) return
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
          event.preventDefault()
          toggleMode()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev, toggleMode])

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      touchStartX.current = event.touches[0]?.clientX ?? null
    }

    function handleTouchEnd(event: TouchEvent) {
      const startX = touchStartX.current
      touchStartX.current = null
      if (startX == null) return
      const endX = event.changedTouches[0]?.clientX ?? startX
      const delta = endX - startX
      if (Math.abs(delta) < SWIPE_THRESHOLD) return
      if (delta < 0) next()
      else prev()
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [next, prev])

  return { stepIndex: clampIndex(stepIndex, stepCount), mode, stepCount, next, prev, goTo, toggleMode, setMode }
}
