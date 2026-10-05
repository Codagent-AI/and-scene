import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((index: number) => setStepIndex(Math.max(0, Math.min(stepCount - 1, index))), [stepCount])
  const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex])
  const prev = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const editable = target?.isContentEditable || !!target?.closest('input, textarea, select, [contenteditable="true"]')
      const control = target?.closest('button, a, [role="button"]')
      if (editable || (control && [' ', 'Enter'].includes(event.key))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') setMode(value => value === 'browse' ? 'present' : 'browse')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev])

  const touchHandlers = {
    onTouchStart: (event: React.TouchEvent) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current; touchStart.current = null
      if (!start) return
      const touch = event.changedTouches[0]; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next()
        else prev()
      }
    },
  }
  return { stepIndex, mode, setMode, goTo, next, prev, touchHandlers }
}
