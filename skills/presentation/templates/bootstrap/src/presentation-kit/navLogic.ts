export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}

export function keyToAction(key: string): NavAction | null {
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

export const SWIPE_MIN_DISTANCE = 40

/** Left swipe advances, right swipe goes back; mostly-vertical gestures are ignored. */
export function swipeToAction(dx: number, dy: number): NavAction | null {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE = 'a[href],button,input,select,textarea,summary,[role="button"],[role="link"],[contenteditable=""],[contenteditable="true"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface Era {
  label: string
  firstIndex: number
}

/** Eras in order of first appearance, each mapped to its first step. */
export function deriveEras(steps: readonly { era: string }[]): Era[] {
  const eras: Era[] = []
  steps.forEach((s, i) => {
    if (!eras.some((e) => e.label === s.era)) eras.push({ label: s.era, firstIndex: i })
  })
  return eras
}

/** On-screen step number (1-based), derived from position. */
export function stepNumber(index: number): number {
  return index + 1
}

export function formatStepNumber(index: number): string {
  return String(stepNumber(index)).padStart(2, '0')
}
