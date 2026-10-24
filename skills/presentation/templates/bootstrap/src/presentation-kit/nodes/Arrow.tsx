import { motion, type SVGMotionProps } from 'motion/react'
import { arrowPath, type Point } from './arrowPath'
import { EXIT } from './shared'

export interface ArrowProps extends Omit<SVGMotionProps<SVGSVGElement>, 'id' | 'layoutId' | 'children' | 'from' | 'to'> {
  id: string
  from: Point
  to: Point
  /** Sideways offset of the curve midpoint; 0 draws a straight line. */
  bend?: number
  twoWay?: boolean
}

/** A line between two canvas points; the path animates when its endpoints change. */
export function Arrow({ id, from, to, bend, twoWay, style, ...rest }: ArrowProps) {
  const head = `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}-head`
  return (
    <motion.svg
      layoutId={id}
      exit={EXIT}
      data-presentation-entity={id}
      data-presentation-node="arrow"
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        ...style,
      }}
      {...rest}
    >
      <defs>
        <marker id={head} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        initial={false}
        animate={{ d: arrowPath(from, to, bend) }}
        fill="none"
        stroke="currentColor"
        markerEnd={`url(#${head})`}
        markerStart={twoWay ? `url(#${head})` : undefined}
      />
    </motion.svg>
  )
}
