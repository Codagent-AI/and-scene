import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types.ts'

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || Boolean(target.closest('input, textarea, select, button, a[href], [role="button"], [contenteditable="true"]'))
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const lastIndex = Math.max(0, stepCount - 1)
  const activeIndex = Math.min(index, lastIndex)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(lastIndex, next))), [lastIndex])
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex])
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex])
  const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isEditable(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])
  const onTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.changedTouches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }, [])
  const onTouchEnd = useCallback((event: TouchEvent) => {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) next()
    else prev()
  }, [next, prev])
  return { index: activeIndex, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
