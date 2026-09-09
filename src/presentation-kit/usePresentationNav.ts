import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

function isFocusedControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || Boolean(target.closest('button, input, select, textarea, a'))
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode) {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const swipeStart = useRef<number | undefined>(undefined)
  const lastIndex = Math.max(0, stepCount - 1)

  const goTo = useCallback((index: number) => setStepIndex(Math.max(0, Math.min(lastIndex, index))), [lastIndex])
  const next = useCallback(() => setStepIndex((index) => Math.min(lastIndex, index + 1)), [lastIndex])
  const previous = useCallback(() => setStepIndex((index) => Math.max(0, index - 1)), [])
  const toggleMode = useCallback(() => setMode((current) => (current === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFocusedControl(event.target)) return
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

  return {
    mode,
    stepIndex,
    goTo,
    next,
    previous,
    toggleMode,
    onTouchStart: (event: React.TouchEvent) => {
      swipeStart.current = event.changedTouches[0]?.clientX
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = swipeStart.current
      const end = event.changedTouches[0]?.clientX
      swipeStart.current = undefined
      if (start === undefined || end === undefined || Math.abs(start - end) < 40) return
      if (end < start) next()
      else previous()
    },
  }
}
