import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="textbox"]'))
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const goTo = useCallback((target: number) => setIndex(Math.min(Math.max(0, target), Math.max(0, stepCount - 1))), [stepCount])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const touchStart = useRef<{ x: number; y: number } | undefined>(undefined)
  const touchHandlers = {
    onTouchStart(event: TouchEvent) { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } },
    onTouchEnd(event: TouchEvent) {
      if (!touchStart.current) return
      const dx = event.changedTouches[0].clientX - touchStart.current.x
      const dy = event.changedTouches[0].clientY - touchStart.current.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)()
      touchStart.current = undefined
    },
  }
  return { index, mode, goTo, next, prev, toggleMode, touchHandlers }
}
