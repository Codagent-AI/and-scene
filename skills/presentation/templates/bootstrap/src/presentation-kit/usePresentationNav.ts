import { useCallback, useEffect, useState } from 'react'
import { SWIPE_THRESHOLD, type Mode } from './constants'

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="slider"], [role="tab"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function actionForKey(key: string): NavAction | null {
  switch (key) {
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
      return 'next'
    case 'ArrowLeft':
    case 'PageUp':
      return 'prev'
    case 'p':
    case 'P':
      return 'toggle-mode'
    default:
      return null
  }
}

/** Left swipe advances, right swipe goes back; only horizontal-dominant travel past the threshold counts. */
export function classifySwipe(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const run = (action: NavAction) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (isInteractiveTarget(e.target)) return
      const action = actionForKey(e.key)
      if (!action) return
      e.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      start = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const action = classifySwipe(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action) run(action)
    }
    const onTouchCancel = () => {
      start = null
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [next, prev, toggleMode])

  return { index, mode, goTo, next, prev, toggleMode, setMode }
}
