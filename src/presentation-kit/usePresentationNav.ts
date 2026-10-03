import { useCallback, useEffect, useRef, useState } from 'react'
import { clampStepIndex } from './navigation.js'

export function usePresentationNav(count: number, initialMode: 'browse' | 'present' = 'browse') {
  const [storedIndex, setIndex] = useState(0)
  const index = clampStepIndex(storedIndex, count)
  const [mode, setMode] = useState(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(clampStepIndex(next, count)), [count])
  const move = useCallback((delta: number) => setIndex(current => clampStepIndex(clampStepIndex(current, count) + delta, count)), [count])
  const next = useCallback(() => move(1), [move])
  const prev = useCallback(() => move(-1), [move])
  const toggleMode = useCallback(() => setMode(current => current === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); move(1) }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); move(-1) }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move, toggleMode])
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
