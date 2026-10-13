import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

const INTERACTIVE = 'button, a[href], input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="slider"], [role="combobox"]'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const last = Math.max(0, count - 1)
  const index = Math.min(position, last)
  const jump = useCallback((target: number) => {
    if (Number.isFinite(target)) setPosition(Math.max(0, Math.min(last, Math.trunc(target))))
  }, [last])
  const next = useCallback(() => setPosition(value => Math.min(last, value + 1)), [last])
  const prev = useCallback(() => setPosition(value => Math.max(0, Math.min(last, value) - 1)), [last])
  const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  const touch = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing) return
      if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return
      if (document.activeElement?.closest(INTERACTIVE)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchHandlers = {
    onTouchStart(event: TouchEvent) {
      const first = event.touches[0]
      touch.current = event.touches.length === 1 && first ? { x: first.clientX, y: first.clientY } : null
    },
    onTouchEnd(event: TouchEvent) {
      const start = touch.current
      touch.current = null
      const end = event.changedTouches[0]
      if (!start || !end) return
      const dx = end.clientX - start.x
      const dy = end.clientY - start.y
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    },
    onTouchCancel() { touch.current = null },
  }

  return { index, mode, next, prev, jump, toggleMode, touchHandlers }
}
