import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './constants'

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="slider"], [role="textbox"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export const SWIPE_MIN_DISTANCE = 40

/** Horizontal swipe resolution: -1 = next (swipe left), 1 = prev (swipe right), 0 = none. */
export function resolveSwipe(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return 0
  return dx < 0 ? -1 : 1
}

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  setMode: (mode: PresentationMode) => void
}

export function usePresentationNav(
  count: number,
  initialMode: PresentationMode = 'present',
): PresentationNav {
  const last = Math.max(0, count - 1)
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const index = Math.min(rawIndex, last)

  const goTo = useCallback(
    (i: number) => setIndex(Math.min(last, Math.max(0, Math.trunc(i)))),
    [last],
  )
  const next = useCallback(() => setIndex((i) => Math.min(last, Math.min(i, last) + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, Math.min(i, last) - 1)), [last])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          prev()
          break
        case 'p':
        case 'P':
          toggleMode()
          break
      }
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      start = t && !isInteractiveTarget(e.target) ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const dir = resolveSwipe(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (dir < 0) next()
      else if (dir > 0) prev()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, toggleMode, setMode }
}
