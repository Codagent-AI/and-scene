import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const next = useCallback(() => setIndex((i) => Math.min(count - 1, i + 1)), [count])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goTo = useCallback((i: number) => setIndex(Math.max(0, Math.min(count - 1, i))), [count])
  const toggleMode = useCallback(() => setMode((m) => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (target instanceof Element) {
        if (target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return
        if ((event.key === ' ' || event.key === 'Enter') && target.closest('button,a,[role="button"]')) return
      }
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  return { index, mode, next, prev, goTo, toggleMode }
}
