import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

const isInteractive = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('button,a,input,textarea,select,[contenteditable="true"],[role="button"]'))

export function usePresentationNav(count: number, initialMode: PresentationMode = 'present') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const clamp = useCallback((target: number) => Math.max(0, Math.min(count - 1, target)), [count])
  const goTo = useCallback((target: number) => setIndex(clamp(target)), [clamp])
  const next = useCallback(() => setIndex((current) => clamp(current + 1)), [clamp])
  const prev = useCallback(() => setIndex((current) => clamp(current - 1)), [clamp])
  const toggleMode = useCallback(() => setMode((current) => current === 'present' ? 'browse' : 'present'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return { index, mode, goTo, next, prev, toggleMode }
}
