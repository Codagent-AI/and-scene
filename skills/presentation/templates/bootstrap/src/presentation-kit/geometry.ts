import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  WIDE_BREAKPOINT,
} from './constants.ts'
import type { Mode, StepMeta } from './types.ts'

export interface FitResult {
  scale: number
  top: number
  bottom: number
}

/** Uniform fit scale of the design canvas inside the mode's stage area. */
export function computeFit(viewportW: number, viewportH: number, mode: Mode): FitResult {
  const { top, bottom } = STAGE_LAYOUT[mode]
  const availH = Math.max(0, viewportH - top - bottom)
  const scale = Math.max(MIN_SCALE, Math.min(viewportW / DESIGN_W, availH / DESIGN_H))
  return { scale, top, bottom }
}

export const isWide = (viewportW: number) => viewportW >= WIDE_BREAKPOINT

export interface EraStart {
  era: string
  firstIndex: number
}

/** Distinct eras in order of first appearance, with the step each one opens at. */
export function eraStarts(steps: readonly StepMeta[]): EraStart[] {
  const seen = new Set<string>()
  const out: EraStart[] = []
  steps.forEach((s, i) => {
    if (!seen.has(s.era)) {
      seen.add(s.era)
      out.push({ era: s.era, firstIndex: i })
    }
  })
  return out
}

export const stepNumber = (index: number) => String(index + 1).padStart(2, '0')
