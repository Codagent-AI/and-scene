import { motion, PresenceContext } from 'motion/react'
import { useEffect } from 'react'
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

interface Shapes {
  shaft: string
  end: string
  start: string
}

/**
 * Last drawn shape per entity id. A continuing arrow whose scene instance was
 * replaced (a group or Scene change) starts from this shape and morphs to its
 * new one instead of appearing at the destination.
 */
const lastShapes = new Map<string, Shapes>()

/**
 * Shaft and heads are plain paths with hook attributes; stroke and fill are
 * left to presentation CSS.
 *
 * `SceneLayer` is an `AnimatePresence` with `initial={false}`, and Motion makes
 * every descendant skip its `initial` values while that presence context says
 * so, which would snap a continuing arrow to its new shape when its scene
 * instance is replaced. The arrow has no exit of its own, so it opts out of
 * the presence context and always animates from its remembered shape.
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
  const shapes: Shapes = {
    shaft: shaftPath(from, to, bend),
    end: headPath(to, from, headSize),
    start: headPath(from, to, headSize),
  }
  const prev = lastShapes.get(id) ?? false
  const { shaft, end, start } = shapes
  useEffect(() => {
    lastShapes.set(id, { shaft, end, start })
  }, [id, shaft, end, start])
  return (
    <PresenceContext.Provider value={null}>
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
          initial={prev && { d: prev.shaft }}
          animate={{ d: shaft }}
          transition={t}
        />
        <motion.path
          data-presentation-arrow-head="end"
          initial={prev && { d: prev.end }}
          animate={{ d: end }}
          transition={t}
        />
        {bidirectional && (
          <motion.path
            data-presentation-arrow-head="start"
            initial={prev && { d: prev.start }}
            animate={{ d: start }}
            transition={t}
          />
        )}
      </motion.svg>
    </PresenceContext.Provider>
  )
}
