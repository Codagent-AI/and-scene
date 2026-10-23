import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_ANIMATE, EXIT_ANIMATE, LAYOUT_T } from '../constants'
import { geometryStyle, type GeometryProps } from './geometry'

export interface NodeProps
  extends GeometryProps,
    Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  /** Stable entity identity; used as the `layoutId` so the entity morphs across steps. */
  id: string
  children?: ReactNode
  /**
   * Fade this entity in after persisting entities settle. Set it only on the step that
   * introduces the entity: continuing entities stay the same element, unwrapped and unfaded.
   */
  appear?: boolean
}

/** Shared base of the generic primitives: identity, geometry and style hooks, no visuals. */
export function Node({
  kind,
  id,
  x,
  y,
  width,
  height,
  style,
  children,
  appear,
  ...rest
}: NodeProps & { kind: string }) {
  return (
    <motion.div
      transition={LAYOUT_T}
      exit={EXIT_ANIMATE}
      {...(appear ? { initial: { opacity: 0 }, animate: ENTER_ANIMATE } : {})}
      {...rest}
      layoutId={id}
      data-presentation-entity={id}
      data-presentation-node={kind}
      style={{ ...geometryStyle({ x, y, width, height }), ...style }}
    >
      {children}
    </motion.div>
  )
}
