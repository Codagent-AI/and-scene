import { SWIPE_THRESHOLD } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

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

/** Left swipe advances, right swipe goes back; mostly-vertical or short swipes are ignored. */
export function swipeAction(dx: number, dy: number): NavAction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return null
  return dx < 0 ? 'next' : 'prev'
}

const WIDGET_ROLES = [
  'button', 'link', 'slider', 'spinbutton', 'combobox', 'textbox', 'searchbox', 'listbox', 'option',
  'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'scrollbar',
  'tree', 'treeitem', 'grid', 'gridcell',
]
const INTERACTIVE = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'summary', '[contenteditable=""]', '[contenteditable="true"]',
  ...WIDGET_ROLES.map((role) => `[role="${role}"]`),
].join(', ')

/** Focused controls keep their keys instead of driving the deck. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}
