import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_DISTANCE } from './constants.ts'
import type { PresentationMode } from './types.ts'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])
const INTERACTIVE_ROLES = [
  'button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'option', 'switch',
  'slider', 'spinbutton', 'textbox', 'combobox', 'listbox', 'menu', 'tablist',
]
const INTERACTIVE_SELECTOR = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'summary',
  '[contenteditable]:not([contenteditable="false"])',
  ...INTERACTIVE_ROLES.map((role) => `[role="${role}"]`),
].join(',')

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - 1))
}

/** Direction of a horizontal swipe: 1 = next, -1 = previous, 0 = none. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)

  const goTo = useCallback(
    (target: number) => setIndex(clampIndex(target, count)),
    [count],
  )
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      if (NEXT_KEYS.has(event.key)) next()
      else if (PREV_KEYS.has(event.key)) prev()
      else if (event.key === 'p' || event.key === 'P') toggleMode()
      else return
      event.preventDefault()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const from = start
      start = null
      if (!from || !touch) return
      const direction = swipeDirection(touch.clientX - from.x, touch.clientY - from.y)
      if (direction === 1) next()
      else if (direction === -1) prev()
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

  return { index: clampIndex(index, count), mode, goTo, next, prev, toggleMode, setMode }
}
