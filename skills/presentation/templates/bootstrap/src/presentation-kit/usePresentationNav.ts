import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'

export type NavAction = 'next' | 'prev' | 'toggle'

export const SWIPE_MIN = 50

export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(index, Math.max(0, count - 1)))

export function actionForKey(e: {
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
}): NavAction | null {
  if (e.altKey || e.ctrlKey || e.metaKey) return null
  switch (e.key) {
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
      return 'next'
    case 'ArrowLeft':
    case 'PageUp':
      return 'prev'
    case 'p':
    case 'P':
      return 'toggle'
    default:
      return null
  }
}

/** Swiping left advances, swiping right goes back; mostly-vertical drags are ignored. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [role="button"], [contenteditable=""], [contenteditable="true"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

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
    const run = (action: NavAction) =>
      action === 'next' ? next() : action === 'prev' ? prev() : toggleMode()

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isInteractiveTarget(e.target)) return
      const action = actionForKey(e)
      if (!action) return
      if (e.key === ' ' || e.key === 'PageDown' || e.key === 'PageUp') e.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action) run(action)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, goTo, next, prev, setMode, toggleMode }
}
