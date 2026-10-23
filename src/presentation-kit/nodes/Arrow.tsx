import { motion } from 'motion/react'
import { useEffect, type ComponentProps } from 'react'
import { LAYOUT_TRANSITION, presenceProps } from '../motion'
import { arrowHead, arrowShaft, control, type Point } from './arrowGeometry'

export interface ArrowProps extends Omit<ComponentProps<typeof motion.svg>, 'id' | 'children' | 'initial' | 'animate' | 'exit' | 'from' | 'to'> {
  id: string
  from: Point
  to: Point
  /** Perpendicular offset of the control point; 0 draws a straight line. */
  bend?: number
  bidirectional?: boolean
  headSize?: number
  /** Newcomer: fade in after persisting entities settle (a number adds extra delay). */
  appear?: boolean | number
}

interface Geometry {
  shaft: string
  end: string
  start: string
}

// The last drawn geometry per arrow id. When a scene is replaced, the new arrow
// starts from where the previous arrow with the same id was, so it morphs.
const lastDrawn = new Map<string, Geometry>()

/** An SVG arrow whose endpoints animate in place when its coordinates change. */
export function Arrow({ id, from, to, bend = 0, bidirectional = false, headSize = 8, appear, style, ...rest }: ArrowProps) {
  const c = control(from, to, bend)
  const endHead = arrowHead(to, c, headSize)
  const startHead = bidirectional ? arrowHead(from, c, headSize) : arrowHead(from, from, 0)
  const current: Geometry = { shaft: arrowShaft(from, to, bend), end: endHead, start: startHead }
  const before = lastDrawn.get(id) ?? current
  useEffect(() => {
    lastDrawn.set(id, current)
  })
  return (
    <motion.svg
      {...presenceProps(appear)}
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <motion.path data-presentation-arrow-shaft="" fill="none" stroke="currentColor" initial={{ d: before.shaft }} animate={{ d: current.shaft }} transition={LAYOUT_TRANSITION.layout} />
      <motion.path data-presentation-arrow-head="end" fill="currentColor" stroke="none" initial={{ d: before.end }} animate={{ d: current.end }} transition={LAYOUT_TRANSITION.layout} />
      {bidirectional && (
        <motion.path data-presentation-arrow-head="start" fill="currentColor" stroke="none" initial={{ d: before.start }} animate={{ d: current.start }} transition={LAYOUT_TRANSITION.layout} />
      )}
    </motion.svg>
  )
}
