import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types.ts'

type NavigationOptions = {
  stepCount: number
  initialMode?: PresentationMode
}

export function clampStepIndex(index: number, stepCount: number): number {
  return Math.min(Math.max(index, 0), Math.max(0, stepCount - 1))
}

function isFocusedControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return Boolean(target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]'))
}

export function usePresentationNav({ stepCount, initialMode = 'browse' }: NavigationOptions) {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const goToStep = useCallback(
    (index: number) => setStepIndex(clampStepIndex(index, stepCount)),
    [stepCount],
  )
  const next = useCallback(() => goToStep(stepIndex + 1), [goToStep, stepIndex])
  const prev = useCallback(() => goToStep(stepIndex - 1), [goToStep, stepIndex])
  const toggleMode = useCallback(
    () => setMode((current) => (current === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFocusedControl(event.target)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        prev()
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggleMode()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart: (event: TouchEvent) => {
      touchStartX.current = event.changedTouches[0]?.clientX ?? null
    },
    onTouchEnd: (event: TouchEvent) => {
      if (touchStartX.current === null) return
      const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
      touchStartX.current = null
      if (Math.abs(delta) < 50) return
      if (delta < 0) next()
      else prev()
    },
  }

  return { stepIndex, mode, goToStep, next, prev, toggleMode, touchHandlers }
}
