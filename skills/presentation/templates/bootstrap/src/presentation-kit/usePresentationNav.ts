import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(index, count - 1))
const INTERACTIVE = [
  'button', 'a', 'input', 'select', 'textarea', 'summary', 'audio[controls]', 'video[controls]',
  '[contenteditable]:not([contenteditable="false"])', '[tabindex]:not([tabindex="-1"])',
  ...['button', 'slider', 'textbox', 'combobox', 'checkbox', 'radio', 'switch', 'tab',
    'menuitem', 'option', 'listbox', 'treeitem', 'spinbutton'].map(role => `[role="${role}"]`),
].join(',')
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE))
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const go = useCallback((n: number) => setIndex(clamp(n, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  return { index, mode, go, next, prev, toggle,
    onTouchStart: (event: React.TouchEvent) => {
      if (isInteractive(event.target)) { touch.current = null; return }
      const point = event.touches[0]
      touch.current = { x: point.clientX, y: point.clientY }
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touch.current
      touch.current = null
      if (!start) return
      const point = event.changedTouches[0]
      const dx = point.clientX - start.x, dy = point.clientY - start.y
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)()
    },
  }
}
