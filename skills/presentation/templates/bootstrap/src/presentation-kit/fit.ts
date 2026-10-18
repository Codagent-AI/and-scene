import { DESIGN_H, DESIGN_W, MIN_SCALE, type StageGeometry } from './constants'

export interface Fit {
  scale: number
  x: number
  y: number
}

/** Uniform scale of the design canvas into the space left by the chrome, centered. */
export function computeFit(
  width: number,
  height: number,
  geometry: StageGeometry,
  tocVisible: boolean,
  designW = DESIGN_W,
  designH = DESIGN_H,
): Fit {
  const left = geometry.left + (tocVisible ? geometry.tocWidth : 0)
  const availW = Math.max(width - left - geometry.right, 0)
  const availH = Math.max(height - geometry.top - geometry.bottom, 0)
  const scale = Math.max(MIN_SCALE, Math.min(availW / designW, availH / designH))
  return {
    scale,
    x: left + (availW - designW * scale) / 2,
    y: geometry.top + (availH - designH * scale) / 2,
  }
}
