import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
import { nodeAttrs, rectStyle, type NodeCommonProps, type Rect } from './shared'

export interface BoxProps extends NodeCommonProps, Rect {
  /** Optional glyph, passed as a component (e.g. `Icon={Sparkles}`). */
  Icon?: LucideIcon
  children?: ReactNode
}

/**
 * A generic container node. Carries `layoutId` so a Box with the same `id` in
 * an adjacent step morphs in place. Supplies no visual styling.
 */
export function Box({ id, Icon, children, className, style, data, ...rect }: BoxProps) {
  return (
    <motion.div
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={{ opacity: 0 }}
      className={className}
      style={{ ...rectStyle(rect), ...style }}
      {...nodeAttrs('box', id, data)}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph="" /> : null}
      {children}
    </motion.div>
  )
}
