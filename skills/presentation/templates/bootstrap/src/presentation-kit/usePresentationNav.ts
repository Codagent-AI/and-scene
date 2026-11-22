import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'

export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index))
}
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,[role="checkbox"],[role="radio"],[role="switch"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="treeitem"],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"],[role="listbox"],[role="menuitem"],[role="tab"],[role="spinbutton"]')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(position, count)
  const go = useCallback((value: number) => setPosition(clampIndex(value, count)), [count])
  const next = useCallback(() => setPosition(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setPosition(i => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    let start: { x: number; y: number } | undefined
    function key(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggleMode() }
    }
    function touchStart(event: TouchEvent) {
      const touch = event.touches[0]
      start = touch && !isInteractive(event.target) ? { x: touch.clientX, y: touch.clientY } : undefined
    }
    function touchEnd(event: TouchEvent) {
      const touch = event.changedTouches[0]
      if (start && touch) {
        const dx = touch.clientX - start.x, dy = touch.clientY - start.y
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
      }
      start = undefined
    }
    function cancel() { start = undefined }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchend', touchEnd, { passive: true })
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchend', touchEnd)
      window.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggleMode])
  return { index, mode, go, next, prev, toggleMode }
}
