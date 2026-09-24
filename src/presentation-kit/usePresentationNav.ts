import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(Math.max(0, stepCount - 1), next))), [stepCount])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof Element && (target.closest('input, textarea, select, button, a, [contenteditable="true"]') !== null)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart: (event: React.TouchEvent) => { const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current
      const touch = event.changedTouches[0]
      touchStart.current = null
      if (!start || Math.abs(touch.clientX - start.x) < 48 || Math.abs(touch.clientX - start.x) < Math.abs(touch.clientY - start.y)) return
      if (touch.clientX < start.x) next()
      else prev()
    },
  }
  return { index, mode, goTo, next, prev, toggleMode, touchHandlers }
}
