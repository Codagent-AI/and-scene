import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const activeIndex = Math.min(index, Math.max(0, count - 1))
  const go = useCallback((next: number) => setIndex(Math.max(0, Math.min(count - 1, next))), [count])
  const next = useCallback(() => setIndex(current => Math.min(count - 1, Math.min(current, count - 1) + 1)), [count])
  const prev = useCallback(() => setIndex(current => Math.max(0, Math.min(current, count - 1) - 1)), [count])
  const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart: (event: React.TouchEvent) => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      if (!touch.current) return
      const dx = event.changedTouches[0].clientX - touch.current.x
      const dy = event.changedTouches[0].clientY - touch.current.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next()
        else prev()
      }
      touch.current = null
    },
  }
  return { index: activeIndex, mode, go, next, prev, toggleMode, touchHandlers }
}
