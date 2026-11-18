import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Mode } from './types'
export const isInteractive = (target: EventTarget | null) => target instanceof Element && !!target.closest('button, a, input, textarea, select, summary, [role="button"], [role="slider"], [role="textbox"], [contenteditable]:not([contenteditable="false"])')
export const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function usePresentationNav(count: number, initialMode: Mode = 'browse', rootRef?: RefObject<HTMLDivElement | null>) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((value: number) => setIndex(clamp(value, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    let start: { x: number; y: number } | undefined
    const touchStart = (event: TouchEvent) => {
      start = event.touches.length === 1 && !isInteractive(event.target) ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : undefined
    }
    const touchEnd = (event: TouchEvent) => {
      if (start && event.changedTouches.length) {
        const dx = event.changedTouches[0].clientX - start.x
        const dy = event.changedTouches[0].clientY - start.y
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
      }
      start = undefined
    }
    const cancel = () => { start = undefined }
    const el = rootRef?.current
    window.addEventListener('keydown', key)
    el?.addEventListener('touchstart', touchStart, { passive: true })
    el?.addEventListener('touchend', touchEnd)
    el?.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key)
      el?.removeEventListener('touchstart', touchStart)
      el?.removeEventListener('touchend', touchEnd)
      el?.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggleMode, rootRef])
  return { index: clamp(index, count), mode, jump, next, prev, toggleMode }
}
