import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const last = Math.max(0, count - 1)
  const safeIndex = Math.min(index, last)
  if (index !== safeIndex) setIndex(safeIndex)
  const [mode, setMode] = useState(initialMode)
  const jump = useCallback((n: number) => setIndex(Math.max(0, Math.min(count - 1, n))), [count])
  const next = useCallback(() => setIndex(i => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target instanceof Element && target.closest('button, a, input, textarea, select, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="slider"], [role="combobox"], [role="textbox"], [role="spinbutton"], [role="checkbox"], [role="radio"], [role="switch"], [role="listbox"], [role="option"], [role="menuitem"], [role="tab"], [role="scrollbar"], [role="searchbox"], [role="treeitem"], [role="gridcell"]')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggle()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, toggle])
  const start = useRef<number | null>(null)
  return { index: safeIndex, mode, jump, next, prev, toggle, onTouchStart: (e: React.TouchEvent) => { start.current = e.touches[0].clientX }, onTouchEnd: (e: React.TouchEvent) => { if (start.current !== null) { const d = e.changedTouches[0].clientX - start.current; if (d < -50) next(); else if (d > 50) prev(); start.current = null } } }
}
