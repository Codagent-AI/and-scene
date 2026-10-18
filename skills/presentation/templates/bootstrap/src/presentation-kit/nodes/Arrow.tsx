import { useContext, useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { ArrowMemoryContext } from '../arrowMemory'
import { DESIGN_H, DESIGN_W, EASE, EXIT_T, LAYOUT_T } from '../constants'

export type Point = readonly [number, number]

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Arrowhead at the start as well. */
  bidirectional?: boolean
  /** Perpendicular offset of the curve's midpoint; 0 draws a straight line. */
  curve?: number
  className?: string
  style?: CSSProperties
  /** Canvas the arrow is drawn on; defaults to the design canvas. */
  width?: number
  height?: number
}

function pathFor(from: Point, to: Point, curve: number): string {
  const [x1, y1] = from
  const [x2, y2] = to
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const cx = (x1 + x2) / 2 - (dy / length) * curve
  const cy = (y1 + y2) / 2 + (dx / length) * curve
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

export function Arrow({
  id,
  from,
  to,
  bidirectional = false,
  curve = 0,
  className,
  style,
  width = DESIGN_W,
  height = DESIGN_H,
  ...rest
}: ArrowProps) {
  const d = pathFor(from, to, curve)
  const memory = useContext(ArrowMemoryContext)
  const [previous] = useState(() => memory.get(id))
  useEffect(() => {
    memory.set(id, d)
    return () => {
      if (memory.get(id) === d) memory.delete(id)
    }
  }, [memory, id, d])
  const head = `${id}-head`
  const tail = `${id}-tail`
  return (
    <motion.svg
      data-presentation-entity={id}
      data-presentation-node="arrow"
      className={className}
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <marker id={head} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
        </marker>
        <marker id={tail} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        initial={previous === undefined ? false : { d: previous }}
        animate={{ d }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
        fill="none"
        stroke="currentColor"
        markerEnd={`url(#${head})`}
        markerStart={bidirectional ? `url(#${tail})` : undefined}
      />
    </motion.svg>
  )
}
