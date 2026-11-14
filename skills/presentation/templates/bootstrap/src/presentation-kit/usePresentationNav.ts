import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,[role="button"],[role="slider"],[role="textbox"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="combobox"],[role="listbox"],[role="menuitem"],[role="spinbutton"],[tabindex]:not([tabindex="-1"]),[contenteditable]:not([contenteditable="false"])')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((n: number) => setIndex(clampIndex(n, count)), [count])
  const next = useCallback(() => setIndex(i => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clampIndex(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  const touch = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  return { index: clampIndex(index, count), mode, next, prev, jump, toggle,
    onTouchStart: (event: React.TouchEvent) => {
      const point = event.touches[0]
      touch.current = point && !isInteractive(event.target) ? { x: point.clientX, y: point.clientY } : null
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touch.current
      touch.current = null
      const point = event.changedTouches[0]
      if (!start || !point) return
      const dx = point.clientX - start.x, dy = point.clientY - start.y
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    },
    onTouchCancel: () => { touch.current = null },
  }
}
