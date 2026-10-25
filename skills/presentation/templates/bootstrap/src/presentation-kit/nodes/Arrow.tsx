import { motion, type SVGMotionProps } from 'motion/react'
import { arrowPaths, type Point } from './arrowPaths.ts'
import { DESIGN_H, DESIGN_W, EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants.ts'

export type ArrowProps = Omit<SVGMotionProps<SVGSVGElement>, 'id' | 'from' | 'to' | 'width' | 'height' | 'children'> & {
  id: string
  from: Point
  to: Point
  /** Quadratic control point; omit for a straight line. */
  curve?: Point
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  /** Marks a subtree whose overlaps are intentional and readable. */
  allowOverlap?: boolean
  width?: number
  height?: number
}

const morph = { duration: LAYOUT_T, ease: EASE }

/** A line or arc between two canvas points; stroke and color come from presentation CSS. */
export function Arrow({
  id,
  from,
  to,
  curve,
  bidirectional,
  allowOverlap,
  width = DESIGN_W,
  height = DESIGN_H,
  style,
  ...rest
}: ArrowProps) {
  const paths = arrowPaths({ from, to, curve })
  return (
    <motion.svg
      data-presentation-node="arrow"
      data-presentation-entity={id}
      data-presentation-allow-overlap={allowOverlap ? '' : undefined}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible', ...style }}
    >
      <motion.path data-presentation-arrow-line="" initial={{ d: paths.line }} animate={{ d: paths.line }} transition={morph} fill="none" />
      <motion.path data-presentation-arrow-head="" initial={{ d: paths.endHead }} animate={{ d: paths.endHead }} transition={morph} fill="none" />
      {bidirectional ? (
        <motion.path data-presentation-arrow-head="start" initial={{ d: paths.startHead }} animate={{ d: paths.startHead }} transition={morph} fill="none" />
      ) : null}
    </motion.svg>
  )
}
