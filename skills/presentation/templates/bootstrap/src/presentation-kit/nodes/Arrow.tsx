import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import type { ValueAnimationTransition } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { SVGAttributes } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants.ts'

interface Point {
  x: number
  y: number
}

interface ArrowProps extends Omit<SVGAttributes<SVGSVGElement>, 'id' | 'from' | 'to'> {
  id: string
  from: Point
  to: Point
  /** Draw a head at both ends. */
  bidirectional?: boolean
  /** Perpendicular offset of the curve control point; 0 draws a straight line. */
  bend?: number
}

const HEAD = 8

function control(a: Point, b: Point, bend: number): Point {
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: (a.x + b.x) / 2 - ((b.y - a.y) / length) * bend, y: (a.y + b.y) / 2 + ((b.x - a.x) / length) * bend }
}

function head(tip: Point, tail: Point) {
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x)
  const point = (a: number) => `${tip.x - HEAD * Math.cos(angle + a)},${tip.y - HEAD * Math.sin(angle + a)}`
  return `${tip.x},${tip.y} ${point(0.45)} ${point(-0.45)}`
}

/**
 * Line or arc between two canvas points; stroke and fill come from `currentColor` and CSS.
 * When `from`, `to` or `bend` change, the arrow morphs to the new geometry in place.
 */
export function Arrow({ id, from, to, bidirectional, bend = 0, ...rest }: ArrowProps) {
  const x1 = useMotionValue(from.x)
  const y1 = useMotionValue(from.y)
  const x2 = useMotionValue(to.x)
  const y2 = useMotionValue(to.y)
  const b = useMotionValue(bend)

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const options: ValueAnimationTransition = { duration: LAYOUT_T, ease: [...EASE] }
    const runs = [animate(x1, from.x, options), animate(y1, from.y, options), animate(x2, to.x, options), animate(y2, to.y, options), animate(b, bend, options)]
    return () => runs.forEach((run) => run.stop())
  }, [from.x, from.y, to.x, to.y, bend, x1, y1, x2, y2, b])

  const points = () => [{ x: x1.get(), y: y1.get() }, { x: x2.get(), y: y2.get() }] as const
  const d = useTransform([x1, y1, x2, y2, b], () => {
    const [a, z] = points()
    const c = control(a, z, b.get())
    return `M${a.x},${a.y} Q${c.x},${c.y} ${z.x},${z.y}`
  })
  const toHead = useTransform([x1, y1, x2, y2, b], () => {
    const [a, z] = points()
    return head(z, b.get() ? control(a, z, b.get()) : a)
  })
  const fromHead = useTransform([x1, y1, x2, y2, b], () => {
    const [a, z] = points()
    return head(a, b.get() ? control(a, z, b.get()) : z)
  })

  return (
    <svg
      {...rest}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      data-presentation-node="arrow"
      data-presentation-id={id}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...rest.style }}
    >
      <motion.path d={d} fill="none" stroke="currentColor" data-presentation-arrow-line />
      <motion.polygon points={toHead} fill="currentColor" data-presentation-arrow-head />
      {bidirectional ? <motion.polygon points={fromHead} fill="currentColor" data-presentation-arrow-head /> : null}
    </svg>
  )
}
