import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function isControl(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,[role="button"],[role="slider"],[role="textbox"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="combobox"],[role="listbox"],[role="menuitem"],[role="tab"],[role="spinbutton"],[tabindex]:not([tabindex="-1"]),[contenteditable]:not([contenteditable="false"])')
}
export function swipeDirection(dx: number, dy: number) { return Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0 }
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const start = useRef<{ x: number; y: number } | null>(null)
  const jump = useCallback((n: number) => setIndex(clampIndex(n, count)), [count])
  const move = useCallback((n: number) => setIndex(i => clampIndex(i + n, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (isControl(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault(); move(['ArrowLeft', 'PageUp'].includes(event.key) ? -1 : 1)
      } else if (event.key.toLowerCase() === 'p') toggle()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [move, toggle])
  return { index, mode, jump, toggle, next: () => move(1), prev: () => move(-1),
    onTouchStart: (event: React.TouchEvent) => { const touch = event.touches[0]; start.current = isControl(event.target) || !touch ? null : { x: touch.clientX, y: touch.clientY } },
    onTouchEnd: (event: React.TouchEvent) => { const touch = event.changedTouches[0]; if (start.current && touch) move(swipeDirection(touch.clientX - start.current.x, touch.clientY - start.current.y)); start.current = null },
  }
}
