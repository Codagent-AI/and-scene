import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,[role="button"],[role="slider"],[role="textbox"],[contenteditable]:not([contenteditable="false"])')
}
export function clampIndex(index: number, count: number) { return Math.max(0, Math.min(count - 1, index)) }
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((target: number) => setIndex(clampIndex(target, count)), [count])
  const next = useCallback(() => setIndex(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clampIndex(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    const t = event.touches[0]
    start.current = !isInteractive(event.target) && t ? { x: t.clientX, y: t.clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const t = event.changedTouches[0], from = start.current
    start.current = null
    if (!t || !from) return
    const dx = t.clientX - from.x, dy = t.clientY - from.y
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
  }
  return { index, mode, jump, next, prev, toggle, onTouchStart, onTouchEnd }
}
