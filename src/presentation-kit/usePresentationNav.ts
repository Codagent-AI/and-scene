import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"],[role="menuitem"],[tabindex]')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const jump = useCallback((n: number) => setIndex(clamp(n, count)), [count])
  const next = useCallback(() => setIndex(n => clamp(n + 1, count)), [count])
  const prev = useCallback(() => setIndex(n => clamp(n - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [next, prev, toggle])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    start.current = event.touches.length === 1 && !isInteractive(event.target) ? { x: touch.clientX, y: touch.clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0]
    if (start.current && touch) {
      const dx = touch.clientX - start.current.x, dy = touch.clientY - start.current.y
      if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    }
    start.current = null
  }
  return { index, mode, jump, next, prev, toggle, onTouchStart, onTouchEnd, onTouchCancel: () => { start.current = null } }
}
