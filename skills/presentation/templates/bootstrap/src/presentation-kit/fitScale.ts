export interface Size {
  width: number
  height: number
}

/** Uniform scale that fits `canvas` inside `available` minus `inset` on every side. */
export function computeFitScale(
  available: Size,
  canvas: Size,
  inset: number,
  minScale: number,
  maxScale: number,
): number {
  const w = Math.max(available.width - inset * 2, 0)
  const h = Math.max(available.height - inset * 2, 0)
  const scale = Math.min(w / canvas.width, h / canvas.height)
  if (!Number.isFinite(scale)) return minScale
  return Math.min(Math.max(scale, minScale), maxScale)
}
