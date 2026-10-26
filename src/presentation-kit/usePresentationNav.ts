import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.trunc(index) || 0))
}
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(
    'button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"],[role="menuitem"],[role="tab"],[role="spinbutton"]',
  )
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(position, count)
  const jump = useCallback((n: number) => setPosition(clampIndex(n, count)), [count])
  const next = useCallback(() => setPosition(n => clampIndex(n + 1, count)), [count])
  const prev = useCallback(() => setPosition(n => clampIndex(n - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    touch.current = e.touches.length === 1 && !isInteractive(e.target)
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
  }
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || !e.changedTouches.length) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
  }
  return { index, mode, jump, next, prev, toggle, onTouchStart, onTouchEnd, onTouchCancel: () => { touch.current = null } }
}
