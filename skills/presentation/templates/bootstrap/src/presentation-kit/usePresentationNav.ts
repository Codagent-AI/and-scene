import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'Spacebar', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])
const SWIPE_MIN_PX = 40

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

const INTERACTIVE =
  'a[href],button,input,select,textarea,summary,[role="button"],[role="tab"],[contenteditable=""],[contenteditable="true"]'

/** True when focus is on a control that owns navigation keys itself. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: PresentationMode) => void
  toggleMode: () => void
}

export function usePresentationNav(
  count: number,
  initialMode: PresentationMode = 'present',
): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)

  const goTo = useCallback(
    (i: number) => setIndex(clampIndex(i, count)),
    [count],
  )
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
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
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    function onStart(e: TouchEvent) {
      const t = e.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    function onEnd(e: TouchEvent) {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [next, prev])

  return { index, mode, next, prev, goTo, setMode, toggleMode }
}
