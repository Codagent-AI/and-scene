import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const currentIndex = count > 0 ? Math.min(index, count - 1) : 0
  const goTo = useCallback((next: number) => { if (count > 0) setIndex(Math.max(0, Math.min(count - 1, next))) }, [count])
  const next = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])
  const prev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])
  const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (target instanceof HTMLElement && (target.matches('input,textarea,select') || target.isContentEditable)) return
      if (event.key === ' ' && target instanceof HTMLElement && target.closest('button,a,[role="button"]')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  return { index: currentIndex, mode, goTo, next, prev, toggleMode }
}
