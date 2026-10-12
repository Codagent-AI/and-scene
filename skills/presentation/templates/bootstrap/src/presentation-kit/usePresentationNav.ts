import { useCallback, useEffect, useState } from 'react'
import { clampIndex } from './utils'
export type Mode = 'browse' | 'present'
export function usePresentationNav(count: number, initialMode: Mode = 'present') {
 const [index, setIndex] = useState(0)
 const [mode, setMode] = useState<Mode>(initialMode)
 const goTo = useCallback((to: number) => setIndex(clampIndex(to, count)), [count])
 const next = useCallback(() => goTo(index + 1), [goTo, index])
 const prev = useCallback(() => goTo(index - 1), [goTo, index])
 const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
 useEffect(() => {
  const onKey = (event: KeyboardEvent) => {
   const target = event.target
   if (target instanceof Element && target.closest('input,textarea,select,button,a,[contenteditable="true"],[role="textbox"]')) return
   if (event.ctrlKey || event.metaKey || event.altKey) return
   if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
   else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
   else if (event.key.toLowerCase() === 'p') toggleMode()
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
 }, [next, prev, toggleMode])
 return { index, mode, setMode, goTo, next, prev, toggleMode }
}
