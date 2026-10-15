import { useCallback, useEffect, useState } from 'react'
import { clampIndex, keyToAction, swipeToAction } from './navigation'
import type { PresentationMode } from './types'

export function usePresentationNav(total: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const goTo = useCallback((next: number) => setIndex(clampIndex(next, total)), [total])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = keyToAction(event.key, event.target, event)
      if (!action) return
      event.preventDefault()
      if (action === 'next') setIndex((value) => clampIndex(value + 1, total))
      if (action === 'prev') setIndex((value) => clampIndex(value - 1, total))
      if (action === 'toggle-mode') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, toggleMode])
  const touchStart = useCallback((event: React.TouchEvent) => { (event.currentTarget as HTMLElement).dataset.touchX = String(event.touches[0]?.clientX ?? 0) }, [])
  const touchEnd = useCallback((event: React.TouchEvent) => {
    const start = Number((event.currentTarget as HTMLElement).dataset.touchX ?? 0)
    const action = swipeToAction((event.changedTouches[0]?.clientX ?? start) - start)
    if (action === 'next') next()
    if (action === 'prev') prev()
  }, [next, prev])
  return { index, mode, setMode, next, prev, goTo, toggleMode, touchStart, touchEnd }
}
