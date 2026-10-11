import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

const TEXT_ENTRY = 'input:not([type]),input[type="text"],input[type="search"],input[type="url"],input[type="tel"],input[type="email"],input[type="password"],input[type="number"],input[type="date"],input[type="time"],input[type="month"],input[type="week"],input[type="datetime-local"],textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'
const NATIVE_SPACE = 'button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"],input[type="checkbox"],input[type="radio"],summary'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [position, setPosition] = useState({ index: 0, stepCount })
  if (position.stepCount !== stepCount) {
    setPosition({ index: Math.min(position.index, Math.max(0, stepCount - 1)), stepCount })
  }
  const index = position.index
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const last = Math.max(0, stepCount - 1)
  const jumpTo = useCallback((target: number) => setPosition({ index: Math.min(last, Math.max(0, target)), stepCount }), [last, stepCount])
  const next = useCallback(() => setPosition((current) => ({ stepCount, index: Math.min(last, current.index + 1) })), [last, stepCount])
  const prev = useCallback(() => setPosition((current) => ({ stepCount, index: Math.max(0, Math.min(current.index, last) - 1) })), [last, stepCount])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof Element ? event.target : null
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || target?.closest(TEXT_ENTRY)) return
      if (event.key === ' ' && target?.closest(NATIVE_SPACE)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return {
    index, mode, next, prev, jumpTo, toggleMode,
    touchHandlers: {
      onTouchStart: (event: React.TouchEvent) => {
        const touch = event.touches.length === 1 ? event.touches[0] : undefined
        touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
      },
      onTouchMove: (event: React.TouchEvent) => { if (event.touches.length !== 1) touchStart.current = null },
      onTouchEnd: (event: React.TouchEvent) => {
        const start = touchStart.current
        const touch = event.changedTouches.length === 1 ? event.changedTouches[0] : undefined
        if (!start || !touch || event.touches.length !== 0) { touchStart.current = null; return }
        const deltaX = touch.clientX - start.x
        const deltaY = touch.clientY - start.y
        if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) (deltaX < 0 ? next : prev)()
        touchStart.current = null
      },
      onTouchCancel: () => { touchStart.current = null },
    },
  }
}
