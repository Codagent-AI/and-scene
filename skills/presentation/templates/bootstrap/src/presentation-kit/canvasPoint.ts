export interface Point {
  x: number
  y: number
}

/** Rendered scale of the fixed canvas, read from the DOM so it is exact at the moment of measurement. */
export function renderedScale(canvas: HTMLElement | null): number {
  if (!canvas || canvas.offsetWidth === 0) return 1
  const scale = canvas.getBoundingClientRect().width / canvas.offsetWidth
  return Number.isFinite(scale) && scale > 0 ? scale : 1
}

/**
 * Motion measures layouts in screen space, but entities live inside the scaled canvas, so a
 * screen-space delta would be scaled a second time. Dividing measured points by the canvas scale
 * keeps the measurements, and therefore the layout deltas, in canvas coordinates.
 */
export function pageToCanvas(canvas: HTMLElement | null, point: Point): Point {
  const scale = renderedScale(canvas)
  return scale === 1 ? point : { x: point.x / scale, y: point.y / scale }
}
