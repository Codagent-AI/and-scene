import { motion } from 'motion/react'
import type { CSSProperties, SVGProps } from 'react'
import { EXIT_ANIMATE, LAYOUT_T } from '../constants'
import { arrowPath, type Point } from './arrowPath'

export interface ArrowProps
  extends Omit<SVGProps<SVGSVGElement>, 'id' | 'from' | 'to' | 'style' | 'ref'> {
  id: string
  from: Point
  to: Point
  /** Perpendicular offset of the curve's control point; 0 draws a straight line. */
  bend?: number
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  style?: CSSProperties
}

const LAYER: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none',
}

export function Arrow({ id, from, to, bend, bidirectional, style, ...rest }: ArrowProps) {
  const head = `${id}-head`
  const d = arrowPath(from, to, bend)
  return (
    <motion.svg
      exit={EXIT_ANIMATE}
      {...(rest as object)}
      data-presentation-entity={id}
      data-presentation-node="arrow"
      style={{ ...LAYER, ...style }}
    >
      <defs>
        <marker
          id={head}
          markerWidth={8}
          markerHeight={8}
          refX={7}
          refY={4}
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0 L8 4 L0 8 z" fill="context-stroke" />
        </marker>
      </defs>
      <motion.path
        fill="none"
        stroke="currentColor"
        initial={{ d }}
        animate={{ d }}
        transition={LAYOUT_T}
        markerEnd={`url(#${head})`}
        markerStart={bidirectional ? `url(#${head})` : undefined}
      />
    </motion.svg>
  )
}
