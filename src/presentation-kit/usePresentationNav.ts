import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [storedIndex, setStoredIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const clamp = useCallback((value: number) => Math.max(0, Math.min(value, stepCount - 1)), [stepCount])
  const index = clamp(storedIndex)
  const goTo = useCallback((target: number) => setStoredIndex(clamp(target)), [clamp])
  const next = useCallback(() => setStoredIndex((current) => clamp(clamp(current) + 1)), [clamp])
  const prev = useCallback(() => setStoredIndex((current) => clamp(clamp(current) - 1)), [clamp])
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

  const touchHandlers = useMemo(() => ({
    onTouchStart: (event: React.TouchEvent) => { const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current
      const touch = event.changedTouches[0]
      touchStart.current = null
      if (!start) return
      const dx = touch.clientX - start.x
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(touch.clientY - start.y)) return
      if (dx < 0) next()
      else prev()
    },
  }), [next, prev])
  return { index, mode, goTo, next, prev, toggleMode, touchHandlers }
}
