import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hookAttrs, HOOK } from '../hooks'
import { nodeAttrs, rectStyle, type NodeCommonProps, type Rect } from './shared'

export interface EmphasisProps extends NodeCommonProps, Rect {
  /** Whether the wrapped content is the focus of the current beat. */
  active: boolean
  children: ReactNode
}

/** Marks emphasis state with a stable hook; the presentation draws the emphasis. */
export function Emphasis({ id, active, children, className, style, data, ...rect }: EmphasisProps) {
  return (
    <motion.div
      layoutId={id}
      layout="position"
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={{ ...rectStyle(rect), ...style }}
      {...nodeAttrs('emphasis', id, data)}
      {...hookAttrs(HOOK.emphasis, active ? 'true' : 'false')}
    >
      {children}
    </motion.div>
  )
}
