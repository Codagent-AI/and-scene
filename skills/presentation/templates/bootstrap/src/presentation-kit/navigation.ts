import { SWIPE_MIN } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(Math.max(count - 1, 0), Math.trunc(index) || 0))

const KEYS: Record<string, NavAction> = {
  ArrowRight: 'next',
  ' ': 'next',
  PageDown: 'next',
  ArrowLeft: 'prev',
  PageUp: 'prev',
  p: 'toggle-mode',
  P: 'toggle-mode',
}

export const keyAction = (key: string): NavAction | null => KEYS[key] ?? null

/** Swipe left advances, swipe right goes back; short or vertical-dominant gestures do nothing. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="combobox"], [role="slider"]'

/** True when the event target is, or sits inside, a control that owns the keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}
