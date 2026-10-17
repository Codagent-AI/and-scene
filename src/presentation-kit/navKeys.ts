import { SWIPE_MIN_DISTANCE } from './constants.ts'

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

const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'])
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'tab', 'menuitem', 'checkbox', 'radio', 'switch', 'slider',
  'textbox', 'combobox', 'listbox', 'option', 'spinbutton', 'searchbox',
])

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const el = target.closest('[contenteditable]:not([contenteditable="false"]), [role], button, a, input, select, textarea, summary')
  if (!el) return false
  if (el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') !== 'false') return true
  const role = el.getAttribute('role')
  return INTERACTIVE_TAGS.has(el.tagName) || (role !== null && INTERACTIVE_ROLES.has(role))
}

/** Map a keyboard event to a navigation action, or null when the key is not ours. */
export function actionForKey(event: KeyboardEvent): NavAction | null {
  if (event.ctrlKey || event.altKey || event.metaKey) return null
  if (isInteractiveTarget(event.target)) return null
  return KEY_ACTIONS[event.key] ?? null
}

/** Horizontal swipe: left advances, right goes back; vertical-dominant gestures are ignored. */
export function actionForSwipe(dx: number, dy: number): NavAction | null {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}
