import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function clampStep(index: number, count: number) {
  return Math.max(0, Math.min(count - 1, index))
}
export function isInteractive(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, a, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="textbox"], [tabindex]',
      ),
    )
  )
}
export function usePresentationNav(
  count: number,
  initialMode: Mode = 'browse',
) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const go = useCallback(
    (next: number) => setIndex(clampStep(next, count)),
    [count],
  )
  const next = useCallback(
    () => setIndex((i) => clampStep(i + 1, count)),
    [count],
  )
  const prev = useCallback(
    () => setIndex((i) => clampStep(i - 1, count)),
    [count],
  )
  const toggle = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isInteractive(event.target)
      )
        return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) {
        event.preventDefault()
        next()
      }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault()
        prev()
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggle])
  const start = useRef<{ x: number; y: number } | null>(null)
  function onTouchStart(event: TouchEvent) {
    if (isInteractive(event.target) || event.touches.length !== 1) {
      start.current = null
      return
    }
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  function onTouchEnd(event: TouchEvent) {
    const point = start.current
    start.current = null
    if (!point || !event.changedTouches.length) return
    const dx = event.changedTouches[0].clientX - point.x
    const dy = event.changedTouches[0].clientY - point.y
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) next()
    else prev()
  }
  return {
    index: clampStep(index, count),
    mode,
    go,
    next,
    prev,
    toggle,
    onTouchStart,
    onTouchEnd,
  }
}
