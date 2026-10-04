import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const safeIndex = Math.max(0, Math.min(Math.max(0, count - 1), index))
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(Math.max(0, count - 1), next))), [count])
  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex])
  const prev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target as HTMLElement | null
      if (target instanceof HTMLElement && target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]')) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const onTouchStart = (event: React.TouchEvent) => { const t = event.changedTouches[0]; touch.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touch.current; touch.current = null
    if (!start) return
    const t = event.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0) next()
      else prev()
    }
  }
  return { index: safeIndex, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
