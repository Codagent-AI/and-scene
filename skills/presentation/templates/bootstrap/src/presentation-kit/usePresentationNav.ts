import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(Math.max(0, count - 1), index))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clamp(position, count)
  const go = useCallback((n: number) => setPosition(clamp(n, count)), [count])
  const next = useCallback(() => setPosition(n => clamp(n + 1, count)), [count])
  const prev = useCallback(() => setPosition(n => clamp(n - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  const touch = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || isInteractive(e.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); toggle() }
    }
    function start(e: TouchEvent) {
      touch.current = e.touches.length === 1 && !isInteractive(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
    }
    function end(e: TouchEvent) {
      const from = touch.current; touch.current = null
      const to = e.changedTouches[0]
      if (!from || !to) return
      const dx = to.clientX - from.x, dy = to.clientY - from.y
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    }
    const cancel = () => { touch.current = null }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key); window.removeEventListener('touchstart', start)
      window.removeEventListener('touchend', end); window.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggle])
  return { index, mode, go, next, prev, toggle }
}
