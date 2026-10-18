import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export const SWIPE_MIN_PX = 40

const CONTROL_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="textbox"]',
].join(',')

/** True when keys on this element belong to the element, not to the deck. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(CONTROL_SELECTOR) !== null
}

/** Direction of a horizontal swipe (+1 next, -1 previous) or 0 when it does not qualify. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: PresentationMode) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse'): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const last = Math.max(0, count - 1)
  const index = Math.min(rawIndex, last)

  const goTo = useCallback((i: number) => setIndex(Math.min(Math.max(0, i), last)), [last])
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      if (NEXT_KEYS.has(e.key)) {
        e.preventDefault()
        next()
      } else if (PREV_KEYS.has(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === 'p' || e.key === 'P') {
        toggleMode()
      }
    }
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current
      touchStart.current = null
      const t = e.changedTouches[0]
      if (!start || !t) return
      const dir = swipeDirection(t.clientX - start.x, t.clientY - start.y)
      if (dir === 1) next()
      else if (dir === -1) prev()
    }
    const onTouchCancel = () => {
      touchStart.current = null
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchCancel)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, setMode, toggleMode }
}
