import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PresentationMode } from './types'

export function clampStepIndex(index: number, stepCount: number) {
  return Math.min(Math.max(0, index), Math.max(0, stepCount - 1))
}

function isFocusedControl(target: EventTarget | null) {
  if (!(target instanceof Element)) return false

  return Boolean(
    target.closest('button, input, textarea, select, a[href], [contenteditable="true"], [role="button"]'),
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
  stepCount: number,
  initialMode: PresentationMode = 'browse',
): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const goTo = useCallback(
    (nextIndex: number) => setIndex(clampStepIndex(nextIndex, stepCount)),
    [stepCount],
  )
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'browse' ? 'present' : 'browse'))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isFocusedControl(event.target)) return

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

  return useMemo(
    () => ({
      index: clampStepIndex(index, stepCount),
      mode,
      next,
      previous,
      goTo,
      toggleMode,
      onTouchStart: (event) => setTouchStart(event.touches[0]?.clientX ?? null),
      onTouchEnd: (event) => {
        const end = event.changedTouches[0]?.clientX
        if (touchStart === null || end === undefined) return

        const delta = end - touchStart
        if (Math.abs(delta) >= 40) {
          if (delta < 0) next()
          else previous()
        }
        setTouchStart(null)
      },
    }),
    [goTo, index, mode, next, previous, stepCount, toggleMode, touchStart],
  )
}
