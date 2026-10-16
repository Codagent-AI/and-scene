import type { AnyStep, PresentationMode } from './types'

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(count - 1, 0)))
}

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export function keyAction(event: { key: string }): NavAction | null {
  switch (event.key) {
    case 'ArrowRight':
    case ' ':
    case 'Spacebar':
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

const INTERACTIVE =
  'a[href],button,input,select,textarea,summary,[contenteditable=""],[contenteditable="true"],[role="button"],[role="link"],[role="tab"],[role="slider"],[role="menuitem"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export const SWIPE_THRESHOLD = 50

/** Left swipe advances, right swipe goes back; mostly-vertical gestures are ignored. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export function otherMode(mode: PresentationMode): PresentationMode {
  return mode === 'present' ? 'browse' : 'present'
}

export interface EraEntry {
  era: string
  /** Index of the first step in this era. */
  firstIndex: number
}

/** Consecutive steps sharing an era label collapse into one entry. */
export function buildEras(steps: readonly { era: string }[]): EraEntry[] {
  const eras: EraEntry[] = []
  steps.forEach((step, i) => {
    if (eras.length === 0 || eras[eras.length - 1].era !== step.era) {
      eras.push({ era: step.era, firstIndex: i })
    }
  })
  return eras
}

export function stepMarker(index: number, count: number): string {
  const width = Math.max(2, String(count).length)
  return String(index + 1).padStart(width, '0')
}

/** Identity of the mounted scene: grouped steps share one key, others get their own. */
export function sceneKey(step: AnyStep): string {
  return step.groupKey !== undefined ? `group:${step.groupKey}` : `step:${step.id}`
}
