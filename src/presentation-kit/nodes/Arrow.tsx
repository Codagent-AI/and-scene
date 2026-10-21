import { useId } from 'react'
import { motion, type SVGMotionProps } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from '../constants.ts'

interface Point {
  x: number
  y: number
}

type ArrowProps = Omit<SVGMotionProps<SVGSVGElement>, 'id' | 'from' | 'to' | 'ref'> & {
  id: string
  from: Point
  to: Point
  /** Draw a head at both ends. */
  twoWay?: boolean
}

/** A line in canvas coordinates; its endpoints animate in place. Inherits `currentColor`. */
export function Arrow({ id, from, to, twoWay = false, style, ...rest }: ArrowProps) {
  const head = `arrowhead-${useId()}`
  return (
    <motion.svg
      data-presentation-entity={id}
      data-presentation-node="arrow"
      {...rest}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      aria-hidden="true"
      style={{ ...style, position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <marker id={head} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.line
        data-presentation-arrow-line=""
        stroke="currentColor"
        markerEnd={`url(#${head})`}
        markerStart={twoWay ? `url(#${head})` : undefined}
        initial={false}
        animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
        transition={LAYOUT_T}
      />
    </motion.svg>
  )
}
