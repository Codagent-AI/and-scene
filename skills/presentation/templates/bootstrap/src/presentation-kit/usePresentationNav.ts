import { useCallback, useEffect, useState } from 'react'
import { SWIPE_THRESHOLD } from './constants.ts'
import type { Mode } from './types.ts'

const INTERACTIVE =
  'button, a[href], input, textarea, select, summary, [contenteditable=""], [contenteditable="true"],' +
  ' [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"],' +
  ' [role="slider"], [role="menuitem"], [role="option"], [role="textbox"], [role="combobox"],' +
  ' [role="listbox"], [role="spinbutton"], [role="searchbox"]'
const TEXT_ENTRY = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'

function matches(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null
}

export const isInteractiveTarget = (t: EventTarget | null) => matches(t, INTERACTIVE)
export const isTextEntryTarget = (t: EventTarget | null) => matches(t, TEXT_ENTRY)

export type NavAction = 'next' | 'prev' | 'toggle-mode'

const KEY_ACTIONS: Record<string, NavAction> = {
  ArrowRight: 'next',
  ' ': 'next',
  PageDown: 'next',
  ArrowLeft: 'prev',
  PageUp: 'prev',
  p: 'toggle-mode',
  P: 'toggle-mode',
}

/** Maps a key event to a navigation action, or null when the key is not the deck's. */
export function keyAction(event: KeyboardEvent): NavAction | null {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return null
  const action = KEY_ACTIONS[event.key]
  if (!action) return null
  if (action === 'toggle-mode') return isTextEntryTarget(event.target) ? null : action
  return isInteractiveTarget(event.target) ? null : action
}

/** A left swipe advances, a right swipe goes back; short or mostly vertical moves are ignored. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(index, Math.max(count - 1, 0)))

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(options: { count: number; initialMode?: Mode }): PresentationNav {
  const { count, initialMode = 'present' } = options
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
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = keyAction(event)
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
      const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action === 'next') next()
      else if (action === 'prev') prev()
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

  return { index, mode, next, prev, goTo, toggleMode }
}
