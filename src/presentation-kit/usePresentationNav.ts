import { useCallback, useEffect, useRef, useState } from 'react'
import { clampStepIndex } from './navigation.js'

export function usePresentationNav(count: number, initialMode: 'browse' | 'present' = 'browse') {
  const [storedIndex, setIndex] = useState(0)
  const index = clampStepIndex(storedIndex, count)
  const [mode, setMode] = useState(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(clampStepIndex(next, count)), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode(current => current === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); setIndex(i => clampStepIndex(clampStepIndex(i, count) + 1, count)) }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); setIndex(i => clampStepIndex(clampStepIndex(i, count) - 1, count)) }
      else if (event.key.toLowerCase() === 'p') setMode(m => m === 'browse' ? 'present' : 'browse')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count])
  const touchStart = (event: React.TouchEvent) => { touch.current = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY } }
  const touchEnd = (event: React.TouchEvent) => {
    if (!touch.current) return
    const dx = event.changedTouches[0].clientX - touch.current.x
    const dy = event.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
    touch.current = null
  }
  return { index, mode, goTo, next, prev, toggleMode, touchStart, touchEnd }
}
