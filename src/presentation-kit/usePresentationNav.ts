import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [navigation, setNavigation] = useState({ index: 0, count })
  if (navigation.count !== count) {
    setNavigation({ index: Math.min(navigation.index, Math.max(0, count - 1)), count })
  }
  const index = navigation.index
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const goTo = useCallback((next: number) => setNavigation({ index: Math.max(0, Math.min(count - 1, next)), count }), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])


  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const editing = target?.matches('input, textarea, select, [contenteditable="true"]')
      if (editing || (target?.closest('button, a, [role="button"]') && event.key !== 'p' && event.key !== 'P')) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return { index, mode, goTo, next, prev, toggleMode }
}
