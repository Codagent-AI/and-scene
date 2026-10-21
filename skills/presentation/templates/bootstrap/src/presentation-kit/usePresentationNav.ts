import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_PX } from './constants'
import type { PresentationMode } from './types'

export type SwipeResult = 'next' | 'prev' | null

/** Horizontal travel must pass the threshold and dominate vertical travel. */
export function classifySwipe(dx: number, dy: number, min = SWIPE_MIN_PX): SwipeResult {
  if (Math.abs(dx) < min || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option',
  'slider', 'spinbutton', 'textbox', 'combobox', 'searchbox',
])
const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, summary'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest(INTERACTIVE_SELECTOR)) return true
  const editable = target.closest('[contenteditable]')
  if (editable && editable.getAttribute('contenteditable') !== 'false') return true
  const roled = target.closest('[role]')
  return !!roled && INTERACTIVE_ROLES.has(roled.getAttribute('role') ?? '')
}

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function keyToAction(key: string): NavAction | null {
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

export interface NavOptions {
  count: number
  initialIndex?: number
  initialMode?: PresentationMode
}

export interface Nav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: PresentationMode) => void
  toggleMode: () => void
}

export function usePresentationNav({
  count,
  initialIndex = 0,
  initialMode = 'browse',
}: NavOptions): Nav {
  const last = Math.max(count - 1, 0)
  const [rawIndex, setIndex] = useState(initialIndex)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const index = Math.min(Math.max(rawIndex, 0), last)

  const goTo = useCallback(
    (target: number) => setIndex(Math.min(Math.max(target, 0), last)),
    [last],
  )
  const next = useCallback(() => setIndex(Math.min(index + 1, last)), [index, last])
  const prev = useCallback(() => setIndex(Math.max(index - 1, 0)), [index])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      const action = keyToAction(event.key)
      if (!action) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      if (!start || !t) return
      const result = classifySwipe(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (result === 'next') next()
      else if (result === 'prev') prev()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, setMode, toggleMode }
}
