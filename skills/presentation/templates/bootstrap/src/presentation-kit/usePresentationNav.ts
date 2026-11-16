import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'
export const clamp = (index: number, count: number) => Math.max(0, Math.min(index, count - 1))
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('button, a, input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="textbox"]')
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [position, setPosition] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clamp(position, count)
  const go = useCallback((n: number) => setPosition(clamp(n, count)), [count])
  const next = useCallback(() => setPosition(n => clamp(n + 1, count)), [count])
  const prev = useCallback(() => setPosition(n => clamp(n - 1, count)), [count])
  const toggle = useCallback(() => setMode(m => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      const action = ['ArrowRight', ' ', 'PageDown'].includes(event.key) ? next : ['ArrowLeft', 'PageUp'].includes(event.key) ? prev : event.key.toLowerCase() === 'p' ? toggle : undefined
      if (action) { event.preventDefault(); action() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, toggle])
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => { start.current = isInteractive(e.target) || e.touches.length !== 1 ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e: TouchEvent) => {
    if (!start.current || !e.changedTouches.length) return
    const dx = e.changedTouches[0].clientX - start.current.x
    const dy = e.changedTouches[0].clientY - start.current.y
    start.current = null
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)()
  }
  return { index, mode, go, next, prev, toggle, onTouchStart, onTouchEnd }
}
