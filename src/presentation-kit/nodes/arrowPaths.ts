export interface Point {
  x: number
  y: number
}

const f = (n: number) => Math.round(n * 100) / 100

export function shaftPath(from: Point, to: Point, bend: number): string {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / len) * bend
  const cy = my + (dx / len) * bend
  return `M ${f(from.x)} ${f(from.y)} Q ${f(cx)} ${f(cy)} ${f(to.x)} ${f(to.y)}`
}

/** Triangle at `tip` pointing away from `origin`. */
export function headPath(tip: Point, origin: Point, size: number): string {
  const a = Math.atan2(tip.y - origin.y, tip.x - origin.x)
  const p = (da: number) => `${f(tip.x - size * Math.cos(a + da))} ${f(tip.y - size * Math.sin(a + da))}`
  return `M ${f(tip.x)} ${f(tip.y)} L ${p(0.45)} L ${p(-0.45)} Z`
}
