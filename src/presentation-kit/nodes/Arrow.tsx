import { motion } from 'motion/react'
import { LAYOUT_T } from '../constants.ts'
import type { NodeHooks } from './placement.ts'

type Point = readonly [number, number]

export interface ArrowProps extends Omit<NodeHooks, 'at'> {
  from: Point
  to: Point
  /** Two cubic control points for a curved connector; omit for a straight line. */
  via?: readonly [Point, Point]
  /** Arrowheads at both ends. */
  both?: boolean
  dashed?: boolean
}

const PAD = 10
const HEAD = 7

/** A connector in canvas coordinates. Stroke and fill inherit `currentColor`. */
export function Arrow({ id, from, to, via, both, dashed, className, style, variant }: ArrowProps) {
  const pts: Point[] = [from, to, ...(via ?? [])]
  const minX = Math.min(...pts.map((p) => p[0])) - PAD
  const minY = Math.min(...pts.map((p) => p[1])) - PAD
  const maxX = Math.max(...pts.map((p) => p[0])) + PAD
  const maxY = Math.max(...pts.map((p) => p[1])) + PAD
  const l = (p: Point) => `${p[0] - minX} ${p[1] - minY}`
  const d = via
    ? `M ${l(from)} C ${l(via[0])}, ${l(via[1])}, ${l(to)}`
    : `M ${l(from)} L ${l(to)}`
  const head = `${id}-head`
  const tail = `${id}-tail`
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      className={className}
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
        pointerEvents: 'none',
        ...style,
      }}
      data-presentation-node="arrow"
      data-presentation-entity={id}
      data-presentation-variant={variant}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${maxX - minX} ${maxY - minY}`} overflow="visible">
        <defs>
          <marker id={head} markerWidth={HEAD} markerHeight={HEAD} refX={HEAD - 1} refY={HEAD / 2} orient="auto" markerUnits="userSpaceOnUse">
            <path d={`M 0 0 L ${HEAD} ${HEAD / 2} L 0 ${HEAD} z`} fill="currentColor" />
          </marker>
          <marker id={tail} markerWidth={HEAD} markerHeight={HEAD} refX={1} refY={HEAD / 2} orient="auto-start-reverse" markerUnits="userSpaceOnUse">
            <path d={`M 0 0 L ${HEAD} ${HEAD / 2} L 0 ${HEAD} z`} fill="currentColor" />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray={dashed ? '5 4' : undefined}
          markerEnd={`url(#${head})`}
          markerStart={both ? `url(#${tail})` : undefined}
        />
      </svg>
    </motion.div>
  )
}
