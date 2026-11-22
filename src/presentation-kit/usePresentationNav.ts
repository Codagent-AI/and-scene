import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './types'
export const isInteractive = (target: EventTarget | null) => target instanceof Element && !!target.closest('button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"]')
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [storedIndex, setIndex] = useState(0)
  const index = Math.max(0, Math.min(count - 1, storedIndex))
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = useCallback((value: number) => setIndex(Math.max(0, Math.min(Math.max(0, count - 1), value))), [count])
  const next = useCallback(() => setIndex(i => Math.min(Math.max(0, count - 1), i + 1)), [count])
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  const start = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      const action = ['ArrowRight', ' ', 'PageDown'].includes(event.key) ? next : ['ArrowLeft', 'PageUp'].includes(event.key) ? prev : event.key.toLowerCase() === 'p' ? toggle : undefined
      if (action) { event.preventDefault(); action() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  return { index, mode, jump, next, prev, toggle,
    onTouchStart: (event: React.TouchEvent) => { start.current = null; if (!isInteractive(event.target)) start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } },
    onTouchEnd: (event: React.TouchEvent) => {
      if (!start.current) return
      const dx = event.changedTouches[0].clientX - start.current.x
      const dy = event.changedTouches[0].clientY - start.current.y
      start.current = null
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev() }
    },
  }
}
