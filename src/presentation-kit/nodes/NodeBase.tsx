import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { entryMotion, EXIT_MOTION } from './entryMotion'

export type NodeProps = Omit<HTMLMotionProps<'div'>, 'layoutId' | 'children'> & {
  /** Stable shared-layout identity; equal ids morph between steps. */
  layoutId?: string
  /** True while this node is newly on screen. Entry is decided by the caller, never by wrapping. */
  entering?: boolean
  children?: ReactNode
}

/**
 * Absolutely positioned, layout-projected element. Geometry comes from the
 * caller's `style`; the kit adds no visual properties. Direct children of a
 * SceneLayer fade out on exit.
 */
export function NodeBase({ layoutId, style, entering = false, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      exit={EXIT_MOTION}
      {...entryMotion(entering)}
      style={{ position: 'absolute', ...style }}
      {...rest}
    />
  )
}
