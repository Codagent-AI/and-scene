import { useCallback, useEffect, useState } from 'react'
import { SWIPE_AXIS_RATIO, SWIPE_MIN_DISTANCE, type Mode } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}

export function keyAction(key: string): NavAction | null {
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

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="spinbutton"]',
  '[role="searchbox"]',
  '[role="treeitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="gridcell"]',
  '[role="scrollbar"]',
  '[role="tree"]',
  '[role="grid"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="radiogroup"]',
  '[role="tablist"]',
  '[role="listbox"]',
  '[role="option"]',
].join(',')

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

/** Returns +1 (advance) for a left swipe, -1 (back) for a right swipe, 0 otherwise. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return 0
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return 0
  return dx < 0 ? 1 : -1
}

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const goTo = useCallback(
    (target: number) => setIndex(clampIndex(target, count)),
    [count],
  )
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      const action = keyAction(event.key)
      if (!action) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    let start: { x: number; y: number } | null = null
    function onTouchStart(event: TouchEvent) {
      const touch = event.touches[0]
      // A multi-touch gesture (pinch) is never a swipe.
      start = touch && event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
    }
    function onTouchCancel() {
      start = null
    }
    function onTouchEnd(event: TouchEvent) {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y)
      start = null
      if (direction === 1) next()
      else if (direction === -1) prev()
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

  return { index, mode, next, prev, goTo, toggleMode }
}
