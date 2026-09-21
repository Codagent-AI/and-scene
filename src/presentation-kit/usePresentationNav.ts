import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import type { PresentationMode } from './types'

const isInteractive = (target: EventTarget | null) => {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, [contenteditable="true"]'))
}

export const clampIndex = (index: number, count: number) => Math.min(Math.max(index, 0), Math.max(count - 1, 0))

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<number | null>(null)
  const next = useCallback(() => setIndex((value) => clampIndex(value + 1, count)), [count])
  const prev = useCallback(() => setIndex((value) => Math.max(0, value - 1)), [])
  const goTo = useCallback((value: number) => setIndex(clampIndex(value, count)), [count])
  const toggleMode = useCallback(() => setMode((value) => value === 'browse' ? 'present' : 'browse'), [])

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

  const touchHandlers = {
    onTouchStart: (event: TouchEvent) => { touchStart.current = event.changedTouches[0]?.clientX ?? null },
    onTouchEnd: (event: TouchEvent) => {
      if (touchStart.current === null) return
      const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
      touchStart.current = null
      if (Math.abs(distance) > 44) {
        if (distance < 0) next()
        else prev()
      }
    },
  }

  return { index, mode, setMode, next, prev, goTo, toggleMode, touchHandlers }
}
