import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'Spacebar', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])
const SWIPE_THRESHOLD = 48

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'])

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (INTERACTIVE_TAGS.has(target.tagName)) return true
  return target.isContentEditable
}

function clampIndex(index: number, stepCount: number): number {
  if (stepCount <= 0) return 0
  return Math.min(Math.max(index, 0), stepCount - 1)
}

export interface UsePresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: PresentationMode) => void
  toggleMode: () => void
  handleTouchStart: (event: TouchEvent) => void
  handleTouchEnd: (event: TouchEvent) => void
}

export function usePresentationNav(
  stepCount: number,
  initialMode: PresentationMode = 'present',
): UsePresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setModeState] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback(
    (next: number) => {
      setIndex(clampIndex(next, stepCount))
    },
    [stepCount],
  )

  const next = useCallback(() => {
    setIndex((current) => clampIndex(current + 1, stepCount))
  }, [stepCount])

  const prev = useCallback(() => {
    setIndex((current) => clampIndex(current - 1, stepCount))
  }, [stepCount])

  const setMode = useCallback((next: PresentationMode) => {
    setModeState(next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === 'present' ? 'browse' : 'present'))
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isInteractiveTarget(event.target)) return
      if (NEXT_KEYS.has(event.key)) {
        event.preventDefault()
        next()
      } else if (PREV_KEYS.has(event.key)) {
        event.preventDefault()
        prev()
      } else if (event.key === 'p' || event.key === 'P') {
        event.preventDefault()
        toggleMode()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      const startX = touchStartX.current
      touchStartX.current = null
      if (startX === null) return
      const endX = event.changedTouches[0]?.clientX ?? startX
      const delta = endX - startX
      if (Math.abs(delta) < SWIPE_THRESHOLD) return
      if (delta < 0) {
        next()
      } else {
        prev()
      }
    },
    [next, prev],
  )

  return { index, mode, next, prev, goTo, setMode, toggleMode, handleTouchStart, handleTouchEnd }
}
