import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('input,textarea,select,button,a,[role="button"],[role="slider"],[role="textbox"],[contenteditable]:not([contenteditable="false"])')
}
export function clampStep(index: number, count: number) { return Math.max(0, Math.min(Math.max(0, count - 1), index)) }
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const goTo = useCallback((step: number) => setIndex(clampStep(step, count)), [count])
  const next = useCallback(() => setIndex(i => clampStep(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clampStep(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    let origin: { x: number; y: number } | undefined
    function start(event: TouchEvent) {
      if (!isInteractive(event.target) && event.touches.length === 1) origin = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }
    function end(event: TouchEvent) {
      const point = event.changedTouches[0]
      if (origin && point) {
        const dx = point.clientX - origin.x, dy = point.clientY - origin.y
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
      }
      origin = undefined
    }
    function cancel() { origin = undefined }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchend', end)
      window.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggleMode])
  return { index: clampStep(index, count), mode, goTo, next, prev, toggleMode }
}
