import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export type EntityProps = Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> &
  Geometry & {
    children?: ReactNode
    /** Stable identity: entities sharing a layoutId morph in place across steps. */
    layoutId?: string
    /** Kind recorded as `data-presentation-node`. */
    kind: string
  }

/** Positioned, layout-animated element every box-shaped primitive is built on. */
export function Entity({ kind, layoutId, x, y, width, height, style, ...rest }: EntityProps) {
  return (
    <motion.div
      data-presentation-node={kind}
      data-presentation-id={layoutId}
      layout
      layoutId={layoutId}
      transition={LAYOUT_TRANSITION}
      style={geometryStyle({ x, y, width, height }, style)}
      {...rest}
    />
  )
}
