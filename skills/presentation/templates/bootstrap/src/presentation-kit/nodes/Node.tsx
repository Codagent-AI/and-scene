import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION, rectStyle } from './geometry'
import type { Rect } from './geometry'

export interface NodeProps
  extends Omit<HTMLMotionProps<'div'>, 'id' | 'layout' | 'layoutId' | 'children'> {
  children?: ReactNode
  /** Stable entity identity; becomes the Motion `layoutId`. */
  id: string
  /** Literal canvas placement. Omit to position with presentation CSS. */
  at?: Rect
}

/** Shared base of the generic primitives: stable identity, layout motion, hooks. */
export function Node({ id, kind, at, style, ...rest }: NodeProps & { kind: string }) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node={kind}
      data-presentation-id={id}
      style={{ ...rectStyle(at), ...style }}
      {...rest}
    />
  )
}
