import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(count - 1, next))), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((value) => value === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select, button, a, [role="button"], [tabindex]:not([tabindex="-1"])'))) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart: (event: React.TouchEvent) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current; touchStart.current = null
      if (!start) return
      const dx = event.changedTouches[0].clientX - start.x
      const dy = event.changedTouches[0].clientY - start.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) next()
        else prev()
      }
    },
  }
  return { index, mode, goTo, next, prev, toggleMode, touchHandlers }
}
