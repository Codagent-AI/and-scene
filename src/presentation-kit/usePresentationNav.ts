import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

function isInteractiveTarget(target: EventTarget | null) {
  const element = target instanceof Element ? target.closest('[contenteditable], button, a, input, select, textarea') : null
  if (!(element instanceof HTMLElement)) return false
  if (element.matches('button, a, input, select, textarea')) return true
  return element.isContentEditable || element.getAttribute('contenteditable') !== 'false'
}

export function clampStep(index: number, stepCount: number) {
  return Math.max(0, Math.min(index, Math.max(0, stepCount - 1)))
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode) {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const goTo = useCallback((index: number) => setStepIndex(clampStep(index, stepCount)), [stepCount])
  const next = useCallback(() => setStepIndex((current) => clampStep(current + 1, stepCount)), [stepCount])
  const prev = useCallback(() => setStepIndex((current) => clampStep(current - 1, stepCount)), [stepCount])
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
    stepIndex: clampStep(stepIndex, stepCount),
    mode,
    goTo,
    next,
    prev,
    toggleMode,
    onTouchStart: (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStart.current
      const end = event.changedTouches[0]
      touchStart.current = null
      if (!start || !end) return
      const horizontal = end.clientX - start.x
      const vertical = end.clientY - start.y
      if (Math.abs(horizontal) < 40 || Math.abs(horizontal) <= Math.abs(vertical)) return
      if (horizontal < 0) next()
      else prev()
    },
  }
}
