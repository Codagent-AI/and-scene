import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
const interactiveRoles = ['button', 'checkbox', 'combobox', 'grid', 'gridcell', 'link', 'listbox', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'radiogroup', 'scrollbar', 'searchbox', 'slider', 'spinbutton', 'switch', 'tab', 'tablist', 'textbox', 'tree', 'treegrid', 'treeitem']
const interactiveSelector = ['button', 'a', 'input', 'select', 'textarea', 'summary', 'audio[controls]', 'video[controls]', 'iframe', '[tabindex]:not([tabindex="-1"])', '[contenteditable]:not([contenteditable="false"])', ...interactiveRoles.map(role => `[role~="${role}"]`)].join(',')
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(interactiveSelector)
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const start = useRef<{ x: number; y: number } | null>(null)
  const go = useCallback((target: number) => setIndex(clamp(target, count)), [count])
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
    const touchStart = (event: TouchEvent) => {
      if (isInteractive(event.target) || event.touches.length !== 1) { start.current = null; return }
      start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }
    const touchEnd = (event: TouchEvent) => {
      const origin = start.current; start.current = null
      if (!origin || !event.changedTouches[0]) return
      const dx = event.changedTouches[0].clientX - origin.x
      const dy = event.changedTouches[0].clientY - origin.y
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchend', touchEnd)
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('touchstart', touchStart); window.removeEventListener('touchend', touchEnd) }
  }, [next, prev, toggle])
  return { index: clamp(index, count), mode, go, next, prev, toggle }
}
