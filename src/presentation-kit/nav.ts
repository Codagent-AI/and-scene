import type { Mode } from './types.ts'

export interface NavState {
  index: number
  mode: Mode
}

export type NavAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; index: number }
  | { type: 'toggle-mode' }

const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))

/** Pure navigation transition. Clamps at both ends; never wraps. */
export function navReducer(state: NavState, action: NavAction, count: number): NavState {
  switch (action.type) {
    case 'next':
      return { ...state, index: clamp(state.index + 1, count) }
    case 'prev':
      return { ...state, index: clamp(state.index - 1, count) }
    case 'goto':
      return { ...state, index: clamp(action.index, count) }
    case 'toggle-mode':
      return { ...state, mode: state.mode === 'present' ? 'browse' : 'present' }
  }
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export function keyToAction(key: string): NavAction | null {
  if (NEXT_KEYS.has(key)) return { type: 'next' }
  if (PREV_KEYS.has(key)) return { type: 'prev' }
  if (key === 'p' || key === 'P') return { type: 'toggle-mode' }
  return null
}

const INTERACTIVE = 'a[href],button,input,select,textarea,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="tab"],[role="link"],[tabindex]:not([tabindex="-1"])'

/** Focused controls keep their own keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

/** Horizontal swipe: left advances, right goes back. */
export function swipeToAction(dx: number, dy: number, minDistance: number): NavAction | null {
  if (Math.abs(dx) < minDistance || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? { type: 'next' } : { type: 'prev' }
}
