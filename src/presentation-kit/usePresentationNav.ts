import { useCallback, useEffect, useState } from 'react'
import { SWIPE_DOMINANCE, SWIPE_MIN_PX } from './constants'
import type { Mode } from './types'

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
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="gridcell"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[role="treeitem"]',
].join(',')

/** True when focus sits on a control, or inside one, so navigation keys belong to it. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export type KeyAction = 'next' | 'prev' | 'toggle-mode'

export function keyAction(key: string): KeyAction | null {
  switch (key) {
    case 'ArrowRight':
    case ' ':
    case 'Spacebar':
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

/** Classifies a touch gesture. Returns null for small or mostly vertical gestures. */
export function classifySwipe(dx: number, dy: number): 'left' | 'right' | null {
  if (Math.abs(dx) < SWIPE_MIN_PX) return null
  if (!(Math.abs(dx) > SWIPE_DOMINANCE * Math.abs(dy))) return null
  return dx < 0 ? 'left' : 'right'
}

export interface PresentationNav {
  index: number
  mode: Mode
  last: number
  go: (index: number) => void
  next: () => void
  prev: () => void
  toggleMode: () => void
}

/** Step index, mode, keyboard, and touch navigation. Clamps at both ends. */
export function usePresentationNav(count: number, initialMode: Mode): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(0, count - 1)

  const go = useCallback((target: number) => setIndex(Math.min(last, Math.max(0, target))), [last])
  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      const action = keyAction(event.key)
      if (action === null) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  useEffect(() => {
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const origin = start
      const touch = event.changedTouches[0]
      start = null
      if (!origin || !touch) return
      const swipe = classifySwipe(touch.clientX - origin.x, touch.clientY - origin.y)
      if (swipe === 'left') next()
      else if (swipe === 'right') prev()
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev])

  return { index, mode, last, go, next, prev, toggleMode }
}
