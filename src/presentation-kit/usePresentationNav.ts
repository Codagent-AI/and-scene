import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
const interactive = 'button,input,textarea,select,a[href],summary,audio[controls],video[controls],[tabindex],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="combobox"],[role="listbox"],[role="menuitem"],[role="option"],[role="tab"],[role="treeitem"],[role="spinbutton"]'
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const go = useCallback((value: number | ((old: number) => number)) => {
    setIndex(old => Math.max(0, Math.min(Math.max(0, count - 1), typeof value === 'function' ? value(old) : value)))
  }, [count])
  const next = useCallback(() => go(old => old + 1), [go])
  const prev = useCallback(() => go(old => old - 1), [go])
  const toggleMode = useCallback(() => setMode(old => old === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof Element && event.target.closest(interactive))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [next, prev, toggleMode])
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    if (event.target instanceof Element && event.target.closest(interactive)) return
    const first = event.touches[0]
    touch.current = first ? { x: first.clientX, y: first.clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current; touch.current = null
    const end = event.changedTouches[0]
    if (!start || !end) return
    const dx = end.clientX - start.x, dy = end.clientY - start.y
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev() }
  }
  return { index: Math.min(index, Math.max(0,count - 1)), mode, go, next, prev, toggleMode, onTouchStart, onTouchEnd, onTouchCancel: () => { touch.current = null } }
}
