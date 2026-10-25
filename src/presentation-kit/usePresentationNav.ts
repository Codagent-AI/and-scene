import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="textbox"], [role="combobox"]')
}
export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.trunc(index)))
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touch = useRef<{x: number; y: number} | null>(null)
  const jump = useCallback((value: number) => setIndex(clampIndex(value, count)), [count])
  const next = useCallback(() => setIndex(value => clampIndex(value + 1, count)), [count])
  const prev = useCallback(() => setIndex(value => clampIndex(value - 1, count)), [count])
  const toggle = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    const start = (event: TouchEvent) => {
      if (isInteractive(event.target) || event.touches.length !== 1) { touch.current = null; return }
      touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }
    const end = (event: TouchEvent) => {
      const origin = touch.current
      touch.current = null
      if (!origin || !event.changedTouches.length) return
      const dx = event.changedTouches[0].clientX - origin.x
      const dy = event.changedTouches[0].clientY - origin.y
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    }
    const cancel = () => { touch.current = null }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end, { passive: true })
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchend', end)
      window.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggle])
  return { index: clampIndex(index, count), mode, jump, next, prev, toggle }
}
