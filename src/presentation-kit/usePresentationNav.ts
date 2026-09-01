import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function clampStepIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

function targetOwnsKeyboard(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest('button, a, input, select, textarea, [contenteditable="true"]'),
  )
}

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  previous: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
}

export function usePresentationNav(
  count: number,
  initialMode: PresentationMode = 'browse',
): PresentationNav {
  const [requestedIndex, setRequestedIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)
  const index = clampStepIndex(requestedIndex, count)

  const goTo = useCallback((nextIndex: number) => {
    setRequestedIndex(clampStepIndex(nextIndex, count))
  }, [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'browse' ? 'present' : 'browse'))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (targetOwnsKeyboard(event.target)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        previous()
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggleMode()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, previous, toggleMode])

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])
  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    const start = touchStartX.current
    const end = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (start === null || end === undefined || Math.abs(start - end) < 40) return
    if (start > end) next()
    else previous()
  }, [next, previous])

  return { index, mode, next, previous, goTo, toggleMode, onTouchStart, onTouchEnd }
}
