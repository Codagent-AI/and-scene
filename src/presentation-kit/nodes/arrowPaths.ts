export interface Point {
  x: number
  y: number
}

const HEAD = 9

function head(tip: Point, from: Point): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const side = (d: number) => `${tip.x - HEAD * Math.cos(angle + d)} ${tip.y - HEAD * Math.sin(angle + d)}`
  return `M ${side(0.45)} L ${tip.x} ${tip.y} L ${side(-0.45)}`
}

/** Every path uses the same command layout, so a change of endpoints animates instead of snapping. */
export function arrowPaths({ from, to, curve }: { from: Point; to: Point; curve?: Point }) {
  const control = curve ?? { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  return {
    line: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    endHead: head(to, control),
    startHead: head(from, control),
  }
}
