import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]')
}
export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(count - 1, Number.isFinite(index) ? Math.trunc(index) : 0))
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((to: number) => setIndex(clampIndex(to, count)), [count])
  const next = useCallback(() => setIndex(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clampIndex(i - 1, count)), [count])
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
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1 || isInteractive(event.target)) { touchStart.current = null; return }
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || !event.changedTouches.length) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev() }
  }
  return { index: clampIndex(index, count), mode, jump, next, prev, toggle, onTouchStart, onTouchEnd }
}
