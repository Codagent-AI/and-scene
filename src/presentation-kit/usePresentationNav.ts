import { useCallback, useEffect, useRef, useState } from 'react'

export function usePresentationNav(count: number, initialMode: 'browse' | 'present' = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const start = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(count - 1, next))), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.isContentEditable || target?.closest('input, textarea, select, button, a, [role="button"], [tabindex]:not([tabindex="-1"])')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') setMode((value) => value === 'browse' ? 'present' : 'browse')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])
  const touchHandlers = {
    onTouchStart: (event: React.TouchEvent) => { const touch = event.touches[0]; start.current = { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      if (!start.current) return
      const dx = event.changedTouches[0].clientX - start.current.x
      const dy = event.changedTouches[0].clientY - start.current.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next()
        else prev()
      }
      start.current = null
    },
  }
  return { index, mode, setMode, goTo, next, prev, touchHandlers }
}
