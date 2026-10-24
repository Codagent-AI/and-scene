import { SWIPE_THRESHOLD } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export function keyAction(event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'>): NavAction | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  if (NEXT_KEYS.has(event.key)) return 'next'
  if (PREV_KEYS.has(event.key)) return 'prev'
  if (event.key === 'p' || event.key === 'P') return 'toggle-mode'
  return null
}

/** Swiping left (negative dx) advances; swiping right goes back. */
export function swipeAction(dx: number, dy: number): NavAction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable=""], [contenteditable="true"]'

/** Focused controls keep their own keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}
