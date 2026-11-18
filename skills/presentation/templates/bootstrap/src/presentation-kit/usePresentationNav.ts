import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]'))
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((value: number) => setIndex(clamp(value, count)), [count])
  const next = useCallback(() => setIndex(i => clamp(i + 1, count)), [count])
  const prev = useCallback(() => setIndex(i => clamp(i - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggle])
  const start = useRef<{ x: number; y: number } | null>(null)
  return { index: clamp(index, count), mode, jump, next, prev, toggle,
    touch: {
      onTouchStart: (event: React.TouchEvent) => {
        start.current = null
        if (isInteractive(event.target)) return
        const point = event.touches[0]; start.current = point ? { x: point.clientX, y: point.clientY } : null
      },
      onTouchEnd: (event: React.TouchEvent) => {
        const point = event.changedTouches[0]; const origin = start.current; start.current = null
        if (!point || !origin) return
        const dx = point.clientX - origin.x; const dy = point.clientY - origin.y
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
      },
      onTouchCancel: () => { start.current = null },
    },
  }
}
