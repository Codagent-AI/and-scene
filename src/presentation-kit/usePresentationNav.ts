import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const jump = useCallback((target: number) => setIndex(Math.max(0, Math.min(count - 1, target))), [count])
  const next = useCallback(() => setIndex(i => Math.min(count - 1, i + 1)), [count])
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (event.altKey || event.metaKey || event.ctrlKey || (target instanceof Element && target.closest('summary,button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"]'))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    const point = event.touches[0]
    start.current = point ? { x: point.clientX, y: point.clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const point = event.changedTouches[0]
    if (start.current && point) {
      const dx = point.clientX - start.current.x
      const dy = point.clientY - start.current.y
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev() }
    }
    start.current = null
  }
  return { index, mode, jump, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
