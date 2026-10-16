import { SWIPE_MIN_PX } from './constants.ts'

export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(Math.max(count - 1, 0), index))

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export type NavAction = 'next' | 'prev' | 'toggle-mode'

/** Interactive controls keep their own keys; deck navigation must not also fire. */
const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="tab"], [role="slider"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && (target.closest(INTERACTIVE) !== null || (target as HTMLElement).isContentEditable === true)
}

/** Maps a key event to a navigation action, or null when the deck should not react. */
export function actionForKey(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  defaultPrevented: boolean
  target: EventTarget | null
}): NavAction | null {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return null
  if (isInteractiveTarget(event.target)) return null
  if (NEXT_KEYS.has(event.key)) return 'next'
  if (PREV_KEYS.has(event.key)) return 'prev'
  if (event.key === 'p' || event.key === 'P') return 'toggle-mode'
  return null
}

/** Horizontal swipe: left advances, right goes back; vertical drags are ignored. */
export function actionForSwipe(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}
