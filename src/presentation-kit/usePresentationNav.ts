import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea, [contenteditable="true"]'))
}

export function clampStep(index: number, stepCount: number) {
  return Math.max(0, Math.min(index, Math.max(0, stepCount - 1)))
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode) {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<number | null>(null)

  const goTo = useCallback((index: number) => setStepIndex(clampStep(index, stepCount)), [stepCount])
  const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex])
  const prev = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        next()
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        prev()
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggleMode()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return {
    stepIndex,
    mode,
    goTo,
    next,
    prev,
    toggleMode,
    onTouchStart: (event: TouchEvent) => { touchStart.current = event.changedTouches[0]?.clientX ?? null },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStart.current
      const end = event.changedTouches[0]?.clientX
      touchStart.current = null
      if (start === null || end === undefined || Math.abs(end - start) < 40) return
      if (end < start) next()
      else prev()
    },
  }
}
