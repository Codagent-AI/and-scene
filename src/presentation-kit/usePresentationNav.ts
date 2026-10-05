import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(count - 1, next))), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="slider"], [role="textbox"]')) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])
  return { index, mode, goTo, next, prev, toggleMode }
}
