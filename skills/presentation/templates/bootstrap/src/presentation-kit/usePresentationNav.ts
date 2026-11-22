import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"],[role="tab"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="checkbox"],[role="radio"],[role="switch"],[role="spinbutton"],[role="listbox"],[role="option"],[role="treeitem"],[role="link"],[tabindex]:not([tabindex="-1"])')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((next: number) => setIndex(Math.max(0, Math.min(count - 1, next))), [count])
  const next = useCallback(() => setIndex(value => Math.max(0, Math.min(count - 1, value + 1))), [count])
  const prev = useCallback(() => setIndex(value => Math.max(0, value - 1)), [])
  const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [next, prev, toggleMode])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    start.current = event.touches.length === 1 && !isInteractive(event.target)
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const origin = start.current
    start.current = null
    if (!origin || !event.changedTouches[0]) return
    const dx = event.changedTouches[0].clientX - origin.x
    const dy = event.changedTouches[0].clientY - origin.y
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
  }
  return { index: Math.min(index, Math.max(0, count - 1)), mode, next, prev, jump, toggleMode, onTouchStart, onTouchEnd, onTouchCancel: () => { start.current = null } }
}
