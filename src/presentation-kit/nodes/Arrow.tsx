import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE, LAYOUT_T } from '../constants.ts'

interface Point {
  x: number
  y: number
}

interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  /** Perpendicular offset (px) of the midpoint; 0 draws a straight line. */
  bend?: number
  className?: string
  variant?: string
  designW?: number
  designH?: number
}

const HEAD = 8

function head(tip: Point, from: Point): string {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x)
  const p = (da: number) =>
    `${tip.x - HEAD * Math.cos(a + da)},${tip.y - HEAD * Math.sin(a + da)}`
  return `M${p(0.45)} L${tip.x},${tip.y} L${p(-0.45)}`
}

/** Path data keep one command structure whatever the geometry, so `d` can interpolate. */
function arrowPaths({ from, to, bend = 0 }: Pick<ArrowProps, 'from' | 'to' | 'bend'>) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1
  const c = { x: mx - ((to.y - from.y) / len) * bend, y: my + ((to.x - from.x) / len) * bend }
  return {
    line: `M${from.x},${from.y} Q${c.x},${c.y} ${to.x},${to.y}`,
    toHead: head(to, c),
    fromHead: head(from, c),
  }
}

const PATH_TRANSITION = { duration: LAYOUT_T, ease: EASE }

/** Connector drawn in canvas coordinates; stroke comes from `currentColor`/CSS. Geometry morphs when endpoints change. */
export function Arrow({
  id,
  from,
  to,
  bidirectional,
  bend = 0,
  className,
  variant,
  designW = DESIGN_W,
  designH = DESIGN_H,
}: ArrowProps) {
  const { line, toHead, fromHead } = arrowPaths({ from, to, bend })
  return (
    <motion.svg
      data-presentation-node="arrow"
      data-presentation-id={id}
      data-variant={variant}
      className={className}
      width={designW}
      height={designH}
      viewBox={`0 0 ${designW} ${designH}`}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, ease: EASE }}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <motion.path initial={false} animate={{ d: line }} transition={PATH_TRANSITION} fill="none" stroke="currentColor" />
      <motion.path initial={false} animate={{ d: toHead }} transition={PATH_TRANSITION} fill="none" stroke="currentColor" />
      {bidirectional && (
        <motion.path initial={false} animate={{ d: fromHead }} transition={PATH_TRANSITION} fill="none" stroke="currentColor" />
      )}
    </motion.svg>
  )
}
