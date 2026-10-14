import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { nodeAttrs, rectStyle, type NodeCommonProps, type Rect } from './shared'

export interface FrameProps extends NodeCommonProps, Rect {
  children?: ReactNode
}

/** A grouping region. Draws nothing itself; the presentation styles the frame. */
export function Frame({ id, children, className, style, data, ...rect }: FrameProps) {
  return (
    <motion.div
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={{ opacity: 0 }}
      className={className}
      style={{ ...rectStyle(rect), ...style }}
      {...nodeAttrs('frame', id, data)}
    >
      {children}
    </motion.div>
  )
}
