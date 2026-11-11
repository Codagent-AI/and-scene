import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(
    'button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]',
  )
}
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const start = useRef<{ x: number; y: number } | null>(null)
  const last = Math.max(0, count - 1)
  const go = useCallback((value: number) => setIndex(Math.max(0, Math.min(last, value))), [last])
  const next = useCallback(() => setIndex(value => Math.min(last, value + 1)), [last])
  const prev = useCallback(() => setIndex(value => Math.max(0, value - 1)), [])
  const toggle = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (isInteractive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); next() }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); prev() }
      if (event.key.toLowerCase() === 'p') toggle()
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [next, prev, toggle])
  const onTouchStart = (event: TouchEvent) => {
    if (isInteractive(event.target) || event.touches.length !== 1) { start.current = null; return }
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  const onTouchEnd = (event: TouchEvent) => {
    const origin = start.current
    start.current = null
    if (!origin || !event.changedTouches.length) return
    const dx = event.changedTouches[0].clientX - origin.x
    const dy = event.changedTouches[0].clientY - origin.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next()
      else prev()
    }
  }
  return { index: Math.min(index, last), mode, go, next, prev, toggle,
    touch: { onTouchStart, onTouchEnd, onTouchCancel: () => { start.current = null } } }
}
