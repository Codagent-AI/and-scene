import { SWIPE_MIN_PX } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

const NEXT_KEYS = new Set(['ArrowRight', 'PageDown', ' ', 'Spacebar'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

const INTERACTIVE_ROLES = [
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'option', 'slider', 'spinbutton',
  'textbox', 'searchbox', 'combobox', 'listbox', 'treeitem',
]

const INTERACTIVE_SELECTOR = [
  'a[href]', 'button', 'input', 'textarea', 'select', 'summary',
  '[contenteditable]:not([contenteditable="false"])',
  ...INTERACTIVE_ROLES.map((role) => `[role="${role}"]`),
].join(',')

/** True when the event target (or an ancestor) is a control that owns keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export function keyAction(event: KeyboardEvent): NavAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (isInteractiveTarget(event.target)) return null
  if (NEXT_KEYS.has(event.key)) return 'next'
  if (PREV_KEYS.has(event.key)) return 'prev'
  if (event.key === 'p' || event.key === 'P') return 'toggle-mode'
  return null
}

export interface Point {
  x: number
  y: number
}

/** Horizontal travel of at least SWIPE_MIN_PX that exceeds vertical travel. */
export function swipeAction(start: Point, end: Point): 'next' | 'prev' | null {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}
