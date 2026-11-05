import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'
export function clamp(index: number, count: number) { return Math.max(0, Math.min(count - 1, index)) }
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const go = useCallback((i: number) => setIndex(clamp(i, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target instanceof Element && target.closest('button, a, input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="tab"], [role="checkbox"], [role="radio"], [role="textbox"], [role="switch"], [role="combobox"], [tabindex]:not([tabindex="-1"])')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      else if (e.key.toLowerCase() === 'p') toggle()
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  return { index, mode, next, prev, go, toggle }
}
