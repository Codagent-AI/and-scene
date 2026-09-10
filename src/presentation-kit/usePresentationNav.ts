import { useCallback, useEffect, useState, type TouchEvent } from 'react'
import type { PresentationMode } from './types'

const isInteractive = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest('button, a, input, select, textarea, [contenteditable="true"]'))

export function clampStep(index: number, count: number) {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const goTo = useCallback((next: number) => setIndex(clampStep(next, count)), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])
  const clampedIndex = clampStep(index, count)

  useEffect(() => {
    if (index === clampedIndex) return
    // The derived index keeps the current render usable; this synchronizes it for later expansions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(clampedIndex)
  }, [clampedIndex, index])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractive(event.target)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        prev()
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggleMode()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const onTouchStart = useCallback((event: TouchEvent) => {
    if (isInteractive(event.target)) {
      setTouchStart(null)
      return
    }
    setTouchStart(event.changedTouches[0]?.clientX ?? null)
  }, [])
  const onTouchEnd = useCallback((event: TouchEvent) => {
    const end = event.changedTouches[0]?.clientX
    if (touchStart === null || end === undefined || isInteractive(event.target)) {
      setTouchStart(null)
      return
    }
    const distance = end - touchStart
    if (Math.abs(distance) >= 40) {
      if (distance < 0) next()
      else prev()
    }
    setTouchStart(null)
  }, [next, prev, touchStart])

  return { index: clampedIndex, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
