export function computeFitScale(
  availW: number,
  availH: number,
  designW: number,
  designH: number,
  minScale: number,
): number {
  if (!(availW > 0) || !(availH > 0)) return 1
  return Math.max(minScale, Math.min(availW / designW, availH / designH))
}
