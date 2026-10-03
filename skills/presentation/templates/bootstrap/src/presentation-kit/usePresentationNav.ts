import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const next = useCallback(() => setIndex((value) => Math.min(count - 1, value + 1)), [count])
  const prev = useCallback(() => setIndex((value) => Math.max(0, value - 1)), [])
  const goTo = useCallback((value: number) => setIndex(Math.max(0, Math.min(count - 1, value))), [count])
  const toggleMode = useCallback(() => setMode((value) => value === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && typeof target.closest === 'function' && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, toggleMode }
}
