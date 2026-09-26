import { useCallback, useEffect, useState } from 'react'

export function usePresentationNav(count: number, initialMode: 'present' | 'browse' = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const clamp = useCallback((position: number) => Math.max(0, Math.min(count - 1, position)), [count])
  const go = useCallback((position: number) => setIndex(clamp(position)), [clamp])
  const next = useCallback(() => setIndex((current) => clamp(current + 1)), [clamp])
  const prev = useCallback(() => setIndex((current) => clamp(current - 1)), [clamp])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement) {
        if (target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
        if (event.key === ' ' && target.closest('button, a')) return
      }
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') setMode((current) => current === 'present' ? 'browse' : 'present')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])
  return { index, mode, setMode, go, next, prev }
}
