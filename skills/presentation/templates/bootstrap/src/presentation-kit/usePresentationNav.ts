import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const safeIndex = Math.max(0, Math.min(index, Math.max(0, count - 1)))
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(Math.max(0, count - 1), next))), [count])
  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex])
  const prev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex])
  const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('input,textarea,select,[contenteditable="true"]') || (target?.closest('button,a,[role="button"]') && event.key !== 'p' && event.key !== 'P')) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  const onTouchStart = (event: React.TouchEvent) => { const t = event.changedTouches[0]; touch.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touch.current; const t = event.changedTouches[0]; touch.current = null
    if (!start || Math.abs(t.clientX - start.x) < 48 || Math.abs(t.clientY - start.y) > Math.abs(t.clientX - start.x)) return
    if (t.clientX < start.x) next()
    else prev()
  }
  return { index: safeIndex, mode, setMode, toggleMode, goTo, next, prev, onTouchStart, onTouchEnd }
}
