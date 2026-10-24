import { motion, type MotionStyle, type SVGMotionProps } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants'
import { useEntityProps } from './shared'

export interface Point {
  x: number
  y: number
}

export interface ArrowProps
  extends Omit<SVGMotionProps<SVGSVGElement>, 'id' | 'layoutId' | 'initial' | 'animate' | 'exit' | 'style' | 'children' | 'from' | 'to' | 'width' | 'height'> {
  id: string
  from: Point
  to: Point
  /** Add a head at `from` as well. */
  bidirectional?: boolean
  style?: MotionStyle
  /** Size of the layer the arrow is drawn on; defaults to the design canvas. */
  width?: number
  height?: number
}

const move = { duration: LAYOUT_T, ease: EASE }

function Head({ at, toward }: { at: Point; toward: Point }) {
  const angle = (Math.atan2(at.y - toward.y, at.x - toward.x) * 180) / Math.PI
  return (
    <motion.g
      data-presentation-arrowhead=""
      style={{ originX: 0, originY: 0 }}
      initial={false}
      animate={{ x: at.x, y: at.y, rotate: angle }}
      transition={move}
    >
      <polygon points="0,0 -10,-5 -10,5" />
    </motion.g>
  )
}

/** A line between two points with a head at the end; styled through its data hooks. */
export function Arrow({ id, from, to, bidirectional, style, width = DESIGN_W, height = DESIGN_H, ...rest }: ArrowProps) {
  const entity = useEntityProps('arrow', id)
  return (
    <motion.svg
      {...entity}
      {...rest}
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <motion.line initial={false} animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }} transition={move} />
      <Head at={to} toward={from} />
      {bidirectional && <Head at={from} toward={to} />}
    </motion.svg>
  )
}
