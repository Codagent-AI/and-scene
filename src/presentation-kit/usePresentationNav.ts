import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button,a,input,textarea,select,[role="button"],[role="slider"],[role="textbox"],[contenteditable]:not([contenteditable="false"])'))
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((value: number) => setIndex(Math.max(0, Math.min(count - 1, value))), [count])
  const next = useCallback(() => setIndex(i => Math.min(count - 1, i + 1)), [count])
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggleMode])
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    touch.current = event.touches.length === 1 && !isInteractive(event.target)
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || !event.changedTouches.length) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
  }
  return { index: Math.min(index, count - 1), mode, jump, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
