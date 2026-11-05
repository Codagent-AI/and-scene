import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const jump = useCallback((n: number) => setIndex(Math.max(0, Math.min(count - 1, n))), [count])
  const next = useCallback(() => setIndex(i => Math.min(count - 1, i + 1)), [count])
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target instanceof Element && target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="button"]')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggle()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, toggle])
  const start = useRef<number | null>(null)
  return { index, mode, jump, next, prev, toggle, onTouchStart: (e: React.TouchEvent) => { start.current = e.touches[0].clientX }, onTouchEnd: (e: React.TouchEvent) => { if (start.current !== null) { const d = e.changedTouches[0].clientX - start.current; if (d < -50) next(); else if (d > 50) prev(); start.current = null } } }
}
