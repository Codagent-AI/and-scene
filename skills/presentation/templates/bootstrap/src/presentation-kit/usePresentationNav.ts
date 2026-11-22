import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(position, count)
  const jump = useCallback((next: number) => setPosition(clampIndex(next, count)), [count])
  const next = useCallback(() => setPosition(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setPosition(i => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        (target instanceof Element && target.closest('button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]'))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggleMode])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1 || (event.target instanceof Element && event.target.closest('button,a,input,textarea,select,[contenteditable]'))) { start.current = null; return }
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  const onTouchEnd = (event: TouchEvent) => {
    if (!start.current || !event.changedTouches.length) return
    const dx = event.changedTouches[0].clientX - start.current.x
    const dy = event.changedTouches[0].clientY - start.current.y
    start.current = null
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
  }
  return { index, mode, jump, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
