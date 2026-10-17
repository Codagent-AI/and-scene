import { SWIPE_THRESHOLD } from './constants'
import type { SceneStep } from './types'

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

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"])'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

/** Maps a key event to a navigation action, or null when the event is not ours. */
export function keyAction(event: KeyboardEvent): NavAction | null {
  if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return null
  if (isInteractiveTarget(event.target)) return null
  return KEY_ACTIONS[event.key] ?? null
}

export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - 1))
}

export interface Section {
  era: string
  firstIndex: number
  lastIndex: number
}

/** Groups consecutive steps with the same era; repeated eras form separate sections. */
export function buildSections(steps: readonly Pick<SceneStep, 'era'>[]): Section[] {
  const sections: Section[] = []
  steps.forEach((step, index) => {
    const last = sections[sections.length - 1]
    if (last && last.era === step.era) last.lastIndex = index
    else sections.push({ era: step.era, firstIndex: index, lastIndex: index })
  })
  return sections
}
