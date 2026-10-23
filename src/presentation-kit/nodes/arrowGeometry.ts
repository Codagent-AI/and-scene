export interface Point {
  x: number
  y: number
}

export function control(from: Point, to: Point, bend: number): Point {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1
  return { x: mx - ((to.y - from.y) / len) * bend, y: my + ((to.x - from.x) / len) * bend }
}

const f = (n: number) => Number(n.toFixed(2))

export function arrowShaft(from: Point, to: Point, bend = 0): string {
  const c = control(from, to, bend)
  return `M ${f(from.x)} ${f(from.y)} Q ${f(c.x)} ${f(c.y)} ${f(to.x)} ${f(to.y)}`
}

/** Triangle at `tip`, pointing away from `tail`. */
export function arrowHead(tip: Point, tail: Point, size = 8): string {
  const a = Math.atan2(tip.y - tail.y, tip.x - tail.x)
  const p = (da: number): Point => ({ x: tip.x - size * Math.cos(a + da), y: tip.y - size * Math.sin(a + da) })
  const l = p(0.45)
  const r = p(-0.45)
  return `M ${f(tip.x)} ${f(tip.y)} L ${f(l.x)} ${f(l.y)} L ${f(r.x)} ${f(r.y)} Z`
}
