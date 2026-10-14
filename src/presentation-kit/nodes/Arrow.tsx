import { useId } from 'react'
import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants'
import { nodeAttrs, type NodeCommonProps } from './shared'

export interface ArrowProps extends NodeCommonProps {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * A directed connector between two design-canvas points. Strokes and head use
 * `currentColor`, so presentation CSS sets the color. Endpoints animate in place
 * when the same `id` continues into the next step.
 */
export function Arrow({ id, x1, y1, x2, y2, className, style, data }: ArrowProps) {
  const headId = useId()
  return (
    <motion.svg
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style }}
      aria-hidden="true"
      {...nodeAttrs('arrow', id, data)}
    >
      <defs>
        <marker id={headId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.line
        fill="none"
        stroke="currentColor"
        markerEnd={`url(#${headId})`}
        initial={false}
        animate={{ x1, y1, x2, y2 }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
      />
    </motion.svg>
  )
}
