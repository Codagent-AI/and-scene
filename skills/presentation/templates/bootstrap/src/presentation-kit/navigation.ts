import { SWIPE_MIN_PX } from './constants'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), count - 1)
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export function keyAction(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): NavAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null
  if (NEXT_KEYS.has(e.key)) return 'next'
  if (PREV_KEYS.has(e.key)) return 'prev'
  if (e.key === 'p' || e.key === 'P') return 'toggle-mode'
  return null
}

/** Horizontal swipes only: left advances, right goes back. */
export function swipeAction(dx: number, dy: number): NavAction | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'tab', 'checkbox', 'radio', 'switch', 'menuitem', 'option',
  'slider', 'spinbutton', 'textbox', 'combobox', 'searchbox', 'listbox', 'treeitem',
])

/** Focused controls keep their own keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'summary') return true
  if (tag === 'a' && target.hasAttribute('href')) return true
  const editable = target.getAttribute('contenteditable')
  if (editable !== null && editable !== 'false') return true
  const role = target.getAttribute('role')
  return role !== null && INTERACTIVE_ROLES.has(role.toLowerCase())
}
