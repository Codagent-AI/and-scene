export type NavAction = 'next' | 'prev' | 'toggle-mode'

/** Keyboard mapping. Modifier and focus checks happen in the hook. */
export function navActionForKey(key: string): NavAction | null {
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

/** Clamps to [0, last]. An empty deck pins to 0 and never wraps. */
export function clampIndex(index: number, count: number): number {
  const last = Math.max(0, count - 1)
  return Math.min(Math.max(index, 0), last)
}

const SWIPE_THRESHOLD = 48

/** Horizontal swipes only: left advances, right goes back. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="option"]',
].join(',')

/** True when a key or gesture starts on a control that should keep its own input. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return target.closest(INTERACTIVE_SELECTOR) !== null
}
