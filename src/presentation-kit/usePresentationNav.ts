import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(count - 1, next))), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const point = event.touches[0]
    touchStart.current = point ? { x: point.clientX, y: point.clientY } : null
  }, [])
  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    const start = touchStart.current
    const point = event.changedTouches[0]
    touchStart.current = null
    if (start && point && Math.abs(point.clientX - start.x) > 48 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y)) {
      if (point.clientX < start.x) next()
      else prev()
    }
  }, [next, prev])
  return { index, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
