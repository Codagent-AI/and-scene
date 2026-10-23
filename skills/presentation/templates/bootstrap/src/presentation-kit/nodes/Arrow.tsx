import { motion } from 'motion/react'
import { useEffect, useState, type CSSProperties, type SVGProps } from 'react'
import { ENTER_ANIMATE, EXIT_ANIMATE, LAYOUT_T } from '../constants'
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
  /** Fade in after persisting entities settle; set only on the introducing step. */
  appear?: boolean
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

/**
 * Last drawn path per arrow id. A path has no layoutId, so an arrow that remounts under an
 * ungrouped scene change starts from where the previous instance of the same id was drawn.
 */
const drawn = new Map<string, { owner: object; d: string }>()

export function Arrow({ id, from, to, bend, bidirectional, style, appear, ...rest }: ArrowProps) {
  const head = `${id}-head`
  const d = arrowPath(from, to, bend)
  const [owner] = useState(() => ({}))
  const [start] = useState(() => drawn.get(id)?.d ?? d)
  useEffect(() => {
    drawn.set(id, { owner, d })
    return () => {
      if (drawn.get(id)?.owner === owner) drawn.delete(id)
    }
  }, [id, owner, d])
  return (
    <motion.svg
      exit={EXIT_ANIMATE}
      {...(appear ? { initial: { opacity: 0 }, animate: ENTER_ANIMATE } : {})}
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
        initial={{ d: start }}
        animate={{ d }}
        transition={LAYOUT_T}
        markerEnd={`url(#${head})`}
        markerStart={bidirectional ? `url(#${head})` : undefined}
      />
    </motion.svg>
  )
}
