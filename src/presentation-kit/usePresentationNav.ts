import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function ownsKeys(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,summary,a,area,input,textarea,select,audio[controls],video[controls],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="tab"],[role="textbox"]')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((n: number) => setIndex(clamp(n, count)), [count])
  const next = useCallback(() => setIndex(n => clamp(n + 1, count)), [count])
  const prev = useCallback(() => setIndex(n => clamp(n - 1, count)), [count])
  const toggleMode = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (ownsKeys(e.target) || e.ctrlKey || e.altKey || e.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
      if (e.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggleMode])
  const start = useRef<{ x: number; y: number } | null>(null)
  const touch = {
    onTouchStart: (e: React.TouchEvent) => {
      start.current = ownsKeys(e.target) || e.touches.length !== 1 ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current || !e.changedTouches.length) return
      const dx = e.changedTouches[0].clientX - start.current.x
      const dy = e.changedTouches[0].clientY - start.current.y
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) next(); else prev() }
      start.current = null
    },
    onTouchCancel: () => { start.current = null },
  }
  return { index: clamp(index, count), mode, next, prev, jump, toggleMode, touch }
}
