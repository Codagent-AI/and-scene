import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="tab"],[role="textbox"]')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const touch = useRef<{x: number; y: number} | null>(null)
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || isInteractive(event.target)) return
      if (['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault()
        const delta = ['ArrowRight', ' ', 'PageDown'].includes(event.key) ? 1 : -1
        setIndex(i => clamp(i + delta, count))
      } else if (event.key.toLowerCase() === 'p') setMode(m => m === 'browse' ? 'present' : 'browse')
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [count])
  const jump = (i: number) => setIndex(clamp(i, count))
  return {
    index: clamp(index, count), mode, jump,
    next: () => setIndex(i => clamp(i + 1, count)), prev: () => setIndex(i => clamp(i - 1, count)),
    toggleMode: () => setMode(m => m === 'browse' ? 'present' : 'browse'),
    onTouchStart: (event: TouchEvent) => {
      if (isInteractive(event.target)) return
      touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    },
    onTouchEnd: (event: TouchEvent) => {
      const start = touch.current
      touch.current = null
      if (!start) return
      const dx = event.changedTouches[0].clientX - start.x
      const dy = event.changedTouches[0].clientY - start.y
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setIndex(i => clamp(i + (dx < 0 ? 1 : -1), count))
    },
  }
}
