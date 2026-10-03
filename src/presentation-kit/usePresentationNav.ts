import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const lastIndex = Math.max(0, stepCount - 1)
  useEffect(() => {
    // Keep the stored index valid if a caller removes steps at runtime.
    // The return value is clamped too, so the render before this sync is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex((value) => Math.min(value, lastIndex))
  }, [lastIndex])
  const next = useCallback(() => setIndex((value) => Math.min(lastIndex, value + 1)), [lastIndex])
  const prev = useCallback(() => setIndex((value) => Math.max(0, value - 1)), [])
  const goTo = useCallback((value: number) => setIndex(Math.min(Math.max(value, 0), lastIndex)), [lastIndex])
  const toggleMode = useCallback(() => setMode((value) => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])
  return { index: Math.min(index, lastIndex), mode, next, prev, goTo, toggleMode }
}
