import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export type NodeProps = Omit<HTMLMotionProps<'div'>, 'layoutId' | 'children'> & {
  /** Stable shared-layout identity; equal ids morph between steps. */
  layoutId?: string
  children?: ReactNode
}

/**
 * Absolutely positioned, layout-projected element. Geometry comes from the
 * caller's `style`; the kit adds no visual properties. Direct children of a
 * SceneLayer fade out on exit.
 */
export function NodeBase({ layoutId, style, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      exit={{ opacity: 0 }}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      style={{ position: 'absolute', ...style }}
      {...rest}
    />
  )
}
