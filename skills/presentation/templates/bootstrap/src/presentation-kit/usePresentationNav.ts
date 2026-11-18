import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clamp = (value: number, last: number) => Math.max(0, Math.min(last, value))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,textarea,select,summary,[role="button"],[role="link"],[role="slider"],[role="textbox"],[contenteditable]:not([contenteditable="false"])')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const jump = useCallback((n: number) => setIndex(clamp(n, count - 1)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count - 1)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count - 1)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isInteractive(e.target)) return
      if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  return { index, mode, next, prev, jump, toggle,
    onTouchStart: (e: React.TouchEvent) => {
      if (isInteractive(e.target)) return
      touch.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touch.current
      touch.current = null
      if (!start) return
      const dx = e.changedTouches[0].clientX - start.x
      const dy = e.changedTouches[0].clientY - start.y
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    },
  }
}
