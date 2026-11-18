import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'
export const clamp = (value: number, count: number) => Math.max(0, Math.min(count - 1, value))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="textbox"]')
}
export function swipeDirection(dx: number, dy: number) {
  return Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clamp(position, count)
  const go = useCallback((i: number) => setPosition(clamp(i, count)), [count])
  const next = useCallback(() => setPosition(i => clamp(clamp(i, count) + 1, count)), [count])
  const prev = useCallback(() => setPosition(i => clamp(clamp(i, count) - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggle()
    }
    let start: { x: number; y: number } | undefined
    const touchStart = (event: TouchEvent) => {
      start = !isInteractive(event.target) && event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : undefined
    }
    const touchEnd = (event: TouchEvent) => {
      const end = event.changedTouches[0]
      if (start && end) {
        const direction = swipeDirection(end.clientX - start.x, end.clientY - start.y)
        if (direction === 1) next()
        if (direction === -1) prev()
      }
      start = undefined
    }
    const cancel = () => { start = undefined }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', touchStart)
    window.addEventListener('touchend', touchEnd)
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchend', touchEnd)
      window.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggle])
  return { index, mode, go, next, prev, toggle }
}
