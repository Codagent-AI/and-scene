import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const next = useCallback(() => setIndex((value) => Math.min(count - 1, value + 1)), [count])
  const prev = useCallback(() => setIndex((value) => Math.max(0, value - 1)), [])
  const goTo = useCallback((value: number) => setIndex(Math.max(0, Math.min(count - 1, value))), [count])
  const toggleMode = useCallback(() => setMode((value) => value === 'browse' ? 'present' : 'browse'), [])
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  const touchHandlers = {
    onTouchStart: (event: React.TouchEvent) => { const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } },
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
  return { index, mode, setMode, next, prev, goTo, toggleMode, touchHandlers }
}
