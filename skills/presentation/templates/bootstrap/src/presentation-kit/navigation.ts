import type { StepMeta } from './types'

export const NEXT_KEYS = ['ArrowRight', ' ', 'PageDown']
export const PREV_KEYS = ['ArrowLeft', 'PageUp']

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, index))
}

/** Direction for a swipe gesture: left swipe advances (+1), right goes back (-1). */
export function swipeDirection(dx: number, dy: number, threshold = 50): 1 | -1 | 0 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return 0
  return dx < 0 ? 1 : -1
}

export interface EraGroup {
  era: string
  start: number
  end: number
}

/** Consecutive steps sharing an era label, with the first step of each. */
export function groupEras(steps: readonly StepMeta[]): EraGroup[] {
  const groups: EraGroup[] = []
  steps.forEach((step, i) => {
    const last = groups[groups.length - 1]
    if (last && last.era === step.era) last.end = i
    else groups.push({ era: step.era, start: i, end: i })
  })
  return groups
}

export function stepMarker(index: number): string {
  return String(index + 1).padStart(2, '0')
}
