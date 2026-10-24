import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, SWIPE_MIN_PX } from './constants.ts'
import type { Mode, StepMeta } from './types.ts'

export interface Era {
  label: string
  firstIndex: number
  indices: number[]
}

/** On-screen step number: always derived from position. */
export const stepNumber = (index: number) => index + 1

export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}

/** Consecutive steps with the same era label form one table-of-contents section. */
export function eraSections(steps: readonly Pick<StepMeta, 'era'>[]): Era[] {
  const eras: Era[] = []
  steps.forEach((step, index) => {
    const last = eras[eras.length - 1]
    if (last && last.label === step.era) last.indices.push(index)
    else eras.push({ label: step.era, firstIndex: index, indices: [index] })
  })
  return eras
}

export function activeEraIndex(eras: readonly Era[], index: number) {
  return eras.findIndex((era) => era.indices.includes(index))
}

/** Uniform fit scale for a stage viewport of the given size. */
export function computeFitScale(
  viewportW: number,
  viewportH: number,
  mode: Mode,
  designW = DESIGN_W,
  designH = DESIGN_H,
) {
  const { insetX, insetY } = STAGE_LAYOUT[mode]
  const availW = Math.max(0, viewportW - 2 * insetX)
  const availH = Math.max(0, viewportH - 2 * insetY)
  return Math.max(MIN_SCALE, Math.min(availW / designW, availH / designH))
}

/** -1 = go back, 1 = advance, 0 = not a navigation swipe. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="slider"], [role="tab"], [role="menuitem"]'

export function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return target.closest(INTERACTIVE) !== null || (target as HTMLElement).isContentEditable === true
}
