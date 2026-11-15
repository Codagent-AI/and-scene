import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(Math.max(0, count - 1), index))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,select,textarea,summary,audio[controls],video[controls],[tabindex]:not([tabindex="-1"]),[role="combobox"],[role="checkbox"],[role="radio"],[role="switch"],[role="spinbutton"],[role="tab"],[role="menuitem"],[role="option"],[role="listbox"],[role="treeitem"],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]')
}
export function swipeDirection(dx: number, dy: number) { return Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0 }
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const go = useCallback((position: number) => setIndex(clamp(position, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    let start: { x: number; y: number } | undefined
    const touchStart = (event: TouchEvent) => { const t = event.touches[0]; start = event.touches.length === 1 && !isInteractive(event.target) ? { x: t.clientX, y: t.clientY } : undefined }
    const touchEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      if (start && t) { const direction = swipeDirection(t.clientX - start.x, t.clientY - start.y); if (direction === 1) next(); if (direction === -1) prev() }
      start = undefined
    }
    const cancel = () => { start = undefined }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchend', touchEnd)
    window.addEventListener('touchcancel', cancel)
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('touchstart', touchStart); window.removeEventListener('touchend', touchEnd); window.removeEventListener('touchcancel', cancel) }
  }, [next, prev, toggle])
  return { index: clamp(index, count), mode, go, next, prev, toggle }
}
