import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

const INTERACTIVE = 'button, a, input, textarea, select, [contenteditable="true"], [role="button"]'
// Gestures starting on these keep their own horizontal drag; scenes opt out with data-presentation-no-swipe.
const NO_SWIPE = `${INTERACTIVE}, [role="slider"], [data-presentation-no-swipe]`

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const last = Math.max(0, stepCount - 1)
  const goTo = useCallback((target: number) => setIndex(Math.max(0, Math.min(last, target))), [last])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode(current => current === 'browse' ? 'present' : 'browse'), [])
  const nextRef = useRef(next)
  const prevRef = useRef(prev)
  useLayoutEffect(() => {
    nextRef.current = next
    prevRef.current = prev
  }, [next, prev])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      switch (event.key) {
        case 'ArrowRight': case ' ': case 'PageDown': event.preventDefault(); next(); break
        case 'ArrowLeft': case 'PageUp': event.preventDefault(); prev(); break
        case 'p': case 'P': toggleMode(); break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  const bindSwipe = useCallback((element: HTMLElement | null) => {
    if (!element) return () => undefined
    let start: { x: number; y: number } | null = null
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (event.target instanceof Element && event.target.closest(NO_SWIPE)) { start = null; return }
      if (touch) start = { x: touch.clientX, y: touch.clientY }
    }
    const onEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!touch || !start) return
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx < 0) nextRef.current()
        else prevRef.current()
      }
      start = null
    }
    element.addEventListener('touchstart', onStart, { passive: true })
    element.addEventListener('touchend', onEnd, { passive: true })
    return () => { element.removeEventListener('touchstart', onStart); element.removeEventListener('touchend', onEnd) }
  }, [])

  return { index, mode, setMode, goTo, next, prev, toggleMode, bindSwipe }
}
