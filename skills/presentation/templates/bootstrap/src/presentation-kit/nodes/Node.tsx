import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { EXIT_ANIMATE } from '../constants'
import { geometryStyle, type GeometryProps } from './geometry'

export interface NodeProps
  extends GeometryProps,
    Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  /** Stable entity identity; used as the `layoutId` so the entity morphs across steps. */
  id: string
  children?: ReactNode
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
  ...rest
}: NodeProps & { kind: string }) {
  return (
    <motion.div
      exit={EXIT_ANIMATE}
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
