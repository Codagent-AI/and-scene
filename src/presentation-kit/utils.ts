import { DESIGN_H, DESIGN_W, MIN_SCALE } from './constants'

export function clampStepIndex(index: number, stepCount: number): number {
  return Math.max(0, Math.min(index, Math.max(0, stepCount - 1)))
}

export function getFitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H): number {
  return Math.max(MIN_SCALE, Math.min(width / designWidth, height / designHeight))
}
