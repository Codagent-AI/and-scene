import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [storedIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const clamp = useCallback((value: number) => Math.max(0, Math.min(count - 1, value)), [count])
  const index = clamp(storedIndex)
  const goTo = useCallback((value: number) => setIndex(clamp(value)), [clamp])
  const next = useCallback(() => setIndex((value) => clamp(clamp(value) + 1)), [clamp])
  const prev = useCallback(() => setIndex((value) => clamp(clamp(value) - 1)), [clamp])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])
  return { index, mode, goTo, next, prev, toggleMode }
}
