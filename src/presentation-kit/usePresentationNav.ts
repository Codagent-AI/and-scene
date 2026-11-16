import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button,a,input,textarea,select,summary,audio[controls],video[controls],iframe,[tabindex],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"]'))
}
export function clamp(index: number, count: number) {
  return Math.max(0, Math.min(count - 1, index))
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((next: number) => setIndex(clamp(next, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      const action = ['ArrowRight', ' ', 'PageDown'].includes(event.key) ? next
        : ['ArrowLeft', 'PageUp'].includes(event.key) ? prev
        : event.key.toLowerCase() === 'p' ? toggleMode : undefined
      if (action) { event.preventDefault(); action() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    touch.current = !isInteractive(event.target) && event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || !event.changedTouches[0]) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)()
  }
  return { index: clamp(index, count), mode, jump, next, prev, toggleMode, onTouchStart, onTouchEnd }
}
