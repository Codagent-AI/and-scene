import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
const interactive = 'button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]'
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((value: number) => setIndex(Math.max(0, Math.min(count - 1, value))), [count])
  const next = useCallback(() => setIndex(i => Math.min(count - 1, i + 1)), [count])
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof Element && e.target.closest(interactive))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); toggleMode() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggleMode])
  const start = useRef<{ x: number; y: number } | null>(null)
  return { index, mode, next, prev, jump, toggleMode, touch: {
    onTouchStart(e: TouchEvent) { const t = e.touches[0]; start.current = t ? { x: t.clientX, y: t.clientY } : null },
    onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0], s = start.current
      start.current = null
      if (!s || !t) return
      const dx = t.clientX - s.x, dy = t.clientY - s.y
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    },
    onTouchCancel() { start.current = null },
  } }
}
