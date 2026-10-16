import { motion } from 'motion/react'
import type { ComponentProps } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants'

export interface ArrowProps extends Omit<ComponentProps<'svg'>, 'id' | 'from' | 'to' | 'ref'> {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  /** Arrowhead length in canvas px (geometry only). */
  head?: number
}

/**
 * Connector between two canvas points. Endpoints animate in place; stroke and
 * fill inherit `currentColor` so presentation CSS decides the look.
 */
export function Arrow({ id, from, to, head = 8, className, ...rest }: ArrowProps) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const wing = (a: number) => ({
    x: to.x - head * Math.cos(angle + a),
    y: to.y - head * Math.sin(angle + a),
  })
  const l = wing(Math.PI / 7)
  const r = wing(-Math.PI / 7)
  const t = { duration: LAYOUT_T, ease: EASE }
  return (
    <svg
      {...rest}
      className={className}
      data-presentation-node="arrow"
      data-presentation-id={id}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <motion.line
        data-presentation-arrow-line
        initial={false}
        animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
        transition={t}
        stroke="currentColor"
      />
      <motion.path
        data-presentation-arrow-head
        initial={false}
        animate={{ d: `M ${to.x} ${to.y} L ${l.x} ${l.y} L ${r.x} ${r.y} Z` }}
        transition={t}
        fill="currentColor"
      />
    </svg>
  )
}
