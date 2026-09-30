import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

const SWIPE_THRESHOLD = 40

function focusedControlConsumesKey(target: EventTarget | null, key: string) {
  if (!(target instanceof HTMLElement)) return false
  const control = target.closest('button, input, select, textarea, [contenteditable="true"]')
  if (!control) return false
  return control.matches('input, select, textarea, [contenteditable="true"]')
    || (control.matches('button') && key === ' ')
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [storedIndex, setStoredIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<number | null>(null)
  const lastIndex = Math.max(0, stepCount - 1)
  const stepIndex = Math.min(storedIndex, lastIndex)

  const goTo = useCallback((index: number) => {
    setStoredIndex(Math.min(lastIndex, Math.max(0, index)))
  }, [lastIndex])
  const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex])
  const previous = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex])
  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'browse' ? 'present' : 'browse'))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || focusedControlConsumesKey(event.target, event.key)) return
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
    touchStart.current = event.touches[0]?.clientX ?? null
  }, [])
  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    const start = touchStart.current
    const end = event.changedTouches[0]?.clientX
    touchStart.current = null
    if (start === null || end === undefined || Math.abs(start - end) < SWIPE_THRESHOLD) return
    if (end < start) next()
    else previous()
  }, [next, previous])

  return { stepIndex, mode, goTo, next, previous, toggleMode, onTouchStart, onTouchEnd }
}
