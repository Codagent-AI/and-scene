import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'
export const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
const interactiveRoles = ['button', 'checkbox', 'combobox', 'grid', 'gridcell', 'link', 'listbox', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'radiogroup', 'scrollbar', 'searchbox', 'slider', 'spinbutton', 'switch', 'tab', 'tablist', 'textbox', 'tree', 'treegrid', 'treeitem']
const interactiveTargets = ['button', 'a', 'input', 'select', 'textarea', 'summary', 'audio[controls]', 'video[controls]', '[tabindex]', '[contenteditable]:not([contenteditable="false"])', ...interactiveRoles.map(role => `[role~="${role}"]`)].join(',')
export function ownsKeys(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(interactiveTargets)
}
export function swipeDirection(dx: number, dy: number) {
  return Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const go = useCallback((n: number) => setIndex(clampIndex(n, count)), [count])
  const next = useCallback(() => setIndex(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clampIndex(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    let start: { x: number; y: number } | undefined
    function key(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || ownsKeys(event.target)) return
      const action = ['ArrowRight', ' ', 'PageDown'].includes(event.key) ? next
        : ['ArrowLeft', 'PageUp'].includes(event.key) ? prev : event.key.toLowerCase() === 'p' ? toggle : undefined
      if (action) { event.preventDefault(); action() }
    }
    function touchStart(event: TouchEvent) {
      start = event.touches.length === 1 && !ownsKeys(event.target) ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : undefined
    }
    function touchEnd(event: TouchEvent) {
      if (!start || !event.changedTouches.length) return
      const direction = swipeDirection(event.changedTouches[0].clientX - start.x, event.changedTouches[0].clientY - start.y)
      start = undefined
      if (direction === 1) next()
      if (direction === -1) prev()
    }
    function cancel() { start = undefined }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', touchStart)
    window.addEventListener('touchend', touchEnd)
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key); window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchend', touchEnd); window.removeEventListener('touchcancel', cancel)
    }
  }, [next, prev, toggle])
  return { index: clampIndex(index, count), mode, go, next, prev, toggle }
}
