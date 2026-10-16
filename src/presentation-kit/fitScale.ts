import { DESIGN_H, DESIGN_W, MIN_SCALE, type StageGeometry } from './constants'

/** Uniform scale that fits the design canvas into a stage region. Pure. */
export function computeFitScale(
  availW: number,
  availH: number,
  geometry: StageGeometry,
  designW: number = DESIGN_W,
  designH: number = DESIGN_H,
): number {
  const w = Math.max(0, availW - geometry.padX * 2)
  const h = Math.max(0, availH - geometry.padY * 2)
  const scale = Math.min(w / designW, h / designH)
  if (!Number.isFinite(scale)) return MIN_SCALE
  return Math.min(geometry.maxScale, Math.max(MIN_SCALE, scale))
}
