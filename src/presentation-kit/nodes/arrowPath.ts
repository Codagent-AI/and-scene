export interface Point {
  x: number
  y: number
}

export const HEAD_LENGTH = 8
const HEAD_SPREAD = 0.5

/**
 * Line segments with arrowheads as one path. Every subpath has two points, so
 * the path has no interior and needs no fill declaration.
 */
export function arrowPath(from: Point, to: Point, bidirectional: boolean): string {
  const segments = [`M${from.x} ${from.y}L${to.x} ${to.y}`]
  const headAt = (tip: Point, origin: Point) => {
    const back = Math.atan2(origin.y - tip.y, origin.x - tip.x)
    for (const angle of [back - HEAD_SPREAD, back + HEAD_SPREAD]) {
      const wing = { x: tip.x + HEAD_LENGTH * Math.cos(angle), y: tip.y + HEAD_LENGTH * Math.sin(angle) }
      segments.push(`M${tip.x} ${tip.y}L${wing.x} ${wing.y}`)
    }
  }
  headAt(to, from)
  if (bidirectional) headAt(from, to)
  return segments.join('')
}
