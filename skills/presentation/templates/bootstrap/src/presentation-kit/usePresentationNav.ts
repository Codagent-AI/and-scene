import { useCallback, useEffect, useRef } from 'react'
import { useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types.ts'

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || Boolean(target.closest('input, textarea, select, button, a[href], [role="button"], [contenteditable="true"]'))
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const activeIndex = Math.min(index, Math.max(0, stepCount - 1))
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => setIndex(Math.max(0, Math.min(Math.max(0, stepCount - 1), next))), [stepCount])
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
    if (!start || Math.abs(touch.clientX - start.x) < 48 || Math.abs(touch.clientX - start.x) < Math.abs(touch.clientY - start.y)) return
    if (touch.clientX < start.x) next()
    else prev()
  }, [next, prev])
  return { index: activeIndex, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
