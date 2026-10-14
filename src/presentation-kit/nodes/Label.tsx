import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { nodeAttrs, rectStyle, type NodeCommonProps, type Rect } from './shared'

export interface LabelProps extends NodeCommonProps, Rect {
  children: ReactNode
}

/** Positioned text. With an `id`, its text morphs in place across steps. */
export function Label({ id, children, className, style, data, ...rect }: LabelProps) {
  return (
    <motion.span
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={{ opacity: 0 }}
      className={className}
      style={{ ...rectStyle(rect), ...style }}
      {...nodeAttrs('label', id, data)}
    >
      {children}
    </motion.span>
  )
}
