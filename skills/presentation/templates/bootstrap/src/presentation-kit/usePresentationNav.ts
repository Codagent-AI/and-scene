import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

const isInteractive = (element: Element | null) =>
  element instanceof HTMLElement &&
  Boolean(element.closest('button, a, input, textarea, select, [contenteditable="true"]'))

export function usePresentationNav(stepCount: number, initialMode: PresentationMode) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(Math.max(0, Math.min(stepCount - 1, nextIndex)))
    },
    [stepCount],
  )
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'browse' ? 'present' : 'browse'))
  }, [])
  const onTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])
  const onTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    const startX = touchStartX.current
    const endX = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (startX === null || endX === undefined || Math.abs(startX - endX) < 40) return
    if (endX < startX) next()
    else prev()
  }, [next, prev])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractive(document.activeElement)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        prev()
      } else if (event.key.toLowerCase() === 'p') {
        toggleMode()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return { index, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
