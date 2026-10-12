import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

const INTERACTIVE = 'input, textarea, select, button, a[href], [contenteditable="true"], [role="textbox"]'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const next = useCallback(() => setIndex((current) => Math.min(Math.max(0, stepCount - 1), Math.max(0, current) + 1)), [stepCount])
  const prev = useCallback(() => setIndex((current) => Math.max(0, Math.min(current, Math.max(0, stepCount - 1)) - 1)), [stepCount])
  const goTo = useCallback((target: number) => setIndex(Math.max(0, Math.min(Math.max(0, stepCount - 1), target))), [stepCount])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof Element && event.target.closest(INTERACTIVE))) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart: (event: TouchEvent) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStart.current
      touchStart.current = null
      if (!start) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next()
        else prev()
      }
    },
  }

  return { index, mode, next, prev, goTo, toggleMode, touchHandlers }
}
