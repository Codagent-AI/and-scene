import { useCallback, useEffect, useRef, useState } from 'react'
export type Mode = 'browse' | 'present'
export function clamp(index: number, count: number) { return Math.max(0, Math.min(count - 1, index)) }
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const start = useRef<number | null>(null)
  const jump = useCallback((i: number) => setIndex(clamp(i, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target instanceof Element && target.closest('button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="tab"], [role="textbox"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="link"]')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggle()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  return { index, mode, jump, next, prev, toggle, touch: { onTouchStart: (e: React.TouchEvent) => { start.current = e.touches[0].clientX }, onTouchEnd: (e: React.TouchEvent) => { if (start.current !== null) { const delta = e.changedTouches[0].clientX - start.current; if (delta < -50) next(); if (delta > 50) prev(); start.current = null } } } }
}
