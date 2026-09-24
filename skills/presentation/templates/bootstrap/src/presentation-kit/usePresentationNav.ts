import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'
import { clampStepIndex } from './utils'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [rawIndex, setRawIndex] = useState(0)
  const index = clampStepIndex(rawIndex, stepCount)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touch = useRef<number | null>(null)
  const goTo = useCallback((next: number) => setRawIndex(clampStepIndex(next, stepCount)), [stepCount])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && 'matches' in target && (target.isContentEditable || target.matches('input, textarea, select, button, a, [role="button"], [tabindex]:not([tabindex="-1"])'))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  return {
    index, mode, goTo, next, prev, toggleMode,
    onTouchStart: (event: React.TouchEvent) => { touch.current = event.touches[0]?.clientX ?? null },
    onTouchEnd: (event: React.TouchEvent) => {
      if (touch.current === null) return
      const delta = (event.changedTouches[0]?.clientX ?? touch.current) - touch.current
      if (Math.abs(delta) > 45) {
        if (delta < 0) next()
        else prev()
      }
      touch.current = null
    },
  }
}
