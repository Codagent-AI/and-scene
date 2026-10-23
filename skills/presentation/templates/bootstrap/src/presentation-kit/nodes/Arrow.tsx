import { motion } from 'motion/react'
import { EASE, LAYOUT_T, DESIGN_H, DESIGN_W } from '../constants.ts'
import { headPath, shaftPath, type Point } from './arrowPaths.ts'
import type { DataAttrs, NodeProps } from './shared.ts'

export interface ArrowProps extends NodeProps, DataAttrs {
  from: Point
  to: Point
  /** Draw a head at both ends. */
  bidirectional?: boolean
  /** Perpendicular offset (px) of the midpoint; makes the shaft an arc. */
  bend?: number
  headSize?: number
}

/**
 * Shaft and heads are plain paths with hook attributes; stroke and fill are
 * left to presentation CSS.
 */
export function Arrow({
  id,
  from,
  to,
  bidirectional = false,
  bend = 0,
  headSize = 10,
  className,
  style,
  ...rest
}: ArrowProps) {
  const t = { duration: LAYOUT_T, ease: EASE }
  return (
    <motion.svg
      {...rest}
      className={className}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
      data-presentation-node="arrow"
      data-presentation-entity={id}
      aria-hidden="true"
    >
      <motion.path
        data-presentation-arrow-shaft=""
        initial={false}
        animate={{ d: shaftPath(from, to, bend) }}
        transition={t}
      />
      <motion.path
        data-presentation-arrow-head="end"
        initial={false}
        animate={{ d: headPath(to, from, headSize) }}
        transition={t}
      />
      {bidirectional && (
        <motion.path
          data-presentation-arrow-head="start"
          initial={false}
          animate={{ d: headPath(from, to, headSize) }}
          transition={t}
        />
      )}
    </motion.svg>
  )
}
