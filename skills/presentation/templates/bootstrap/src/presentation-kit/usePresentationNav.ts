import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), Math.trunc(index)))
}
export function ownsKeys(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,audio[controls],video[controls],[tabindex],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="listbox"],[role="option"],[role="spinbutton"],[role="switch"],[role="checkbox"],[role="radio"],[role="treeitem"],[role="textbox"],[role="slider"],[role="combobox"],[role="menuitem"],[role="tab"]')
}
export function swipeDirection(dx: number, dy: number) {
  return Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const go = useCallback((n: number) => setIndex(clampIndex(n, count)), [count])
  const next = useCallback(() => setIndex(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clampIndex(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (ownsKeys(e.target) || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return
      if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    if (ownsKeys(e.target) || e.touches.length !== 1) { start.current = null; return }
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const origin = start.current
    start.current = null
    if (!origin || !e.changedTouches[0]) return
    const dir = swipeDirection(e.changedTouches[0].clientX - origin.x, e.changedTouches[0].clientY - origin.y)
    if (dir === 1) next()
    if (dir === -1) prev()
  }
  return { index: clampIndex(index, count), mode, go, next, prev, toggle, onTouchStart, onTouchEnd }
}
