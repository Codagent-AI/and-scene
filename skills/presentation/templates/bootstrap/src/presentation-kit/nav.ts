import { SWIPE_MIN_PX } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"])'

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
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

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

/** Swipe left (negative dx) advances; swipe right goes back. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}
