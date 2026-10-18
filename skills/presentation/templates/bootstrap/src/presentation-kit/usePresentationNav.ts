import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_PX } from './constants'
import type { PresentationMode } from './constants'

const INTERACTIVE =
  'button, a, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="tab"]'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

/** Step index + mode state with keyboard and swipe input. Navigation clamps at both ends. */
export function usePresentationNav(
  count: number,
  initialMode: PresentationMode,
): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const last = Math.max(0, count - 1)

  const goTo = useCallback(
    (target: number) => setIndex(Math.min(last, Math.max(0, target))),
    [last],
  )
  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractive(event.target)) return
      if (NEXT_KEYS.has(event.key)) next()
      else if (PREV_KEYS.has(event.key)) prev()
      else if (event.key === 'p' || event.key === 'P') toggleMode()
      else return
      event.preventDefault()
    }

    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch && !isInteractive(event.target) ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const origin = start
      start = null
      if (!origin || !touch) return
      const dx = touch.clientX - origin.x
      const dy = touch.clientY - origin.y
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  // The step list can shrink under a mounted presentation; never report an index past its end.
  return { index: Math.min(index, last), mode, next, prev, goTo, toggleMode }
}
