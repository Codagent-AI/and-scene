import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function clampStepIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

function targetOwnsKeyboard(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest(
      'button, a, input, select, textarea, [contenteditable]:not([contenteditable="false"])',
    ),
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
  const touchStart = useRef<{ x: number; y: number } | null>(null)
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
    // React state intentionally tracks the clamped position if the deck changes size.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequestedIndex((current) => clampStepIndex(current, count))
  }, [count])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
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
    const touch = event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }, [])
  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    const start = touchStart.current
    const end = event.changedTouches[0]
    touchStart.current = null
    if (!start || !end) return
    const horizontalDistance = start.x - end.clientX
    const verticalDistance = start.y - end.clientY
    if (Math.abs(horizontalDistance) < 40 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return
    if (horizontalDistance > 0) next()
    else previous()
  }, [next, previous])

  return { index, mode, next, previous, goTo, toggleMode, onTouchStart, onTouchEnd }
}
