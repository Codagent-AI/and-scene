import { SWIPE_THRESHOLD } from './constants.ts'
import type { Mode } from './types.ts'

export interface NavState {
  index: number
  mode: Mode
}

export type NavAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goTo'; index: number }
  | { type: 'toggleMode' }

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - 1))
}

/** Navigation clamps at both ends; it never wraps. */
export function navReducer(count: number) {
  return (state: NavState, action: NavAction): NavState => {
    switch (action.type) {
      case 'next':
        return { ...state, index: clampIndex(state.index + 1, count) }
      case 'prev':
        return { ...state, index: clampIndex(state.index - 1, count) }
      case 'goTo':
        return { ...state, index: clampIndex(action.index, count) }
      case 'toggleMode':
        return { ...state, mode: state.mode === 'browse' ? 'present' : 'browse' }
    }
  }
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export function keyAction(event: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
}): NavAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (NEXT_KEYS.has(event.key)) return { type: 'next' }
  if (PREV_KEYS.has(event.key)) return { type: 'prev' }
  if (event.key === 'p' || event.key === 'P') return { type: 'toggleMode' }
  return null
}

const INTERACTIVE =
  'a[href],button,input,select,textarea,summary,[role="button"],[role="link"],[contenteditable=""],[contenteditable="true"],[tabindex]:not([tabindex="-1"])'

/** Keys belong to a focused interactive control rather than the deck. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

/** Swiping left advances, swiping right goes back; vertical drags are ignored. */
export function swipeAction(dx: number, dy: number): NavAction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return { type: dx < 0 ? 'next' : 'prev' }
}
