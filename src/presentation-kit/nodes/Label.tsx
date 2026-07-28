import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { classNames } from './classNames'

export interface LabelProps {
  /** Stable identity so this entity morphs in place across steps. */
  layoutId?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Generic text label primitive with no default typography. */
export function Label({ layoutId, className, style, children }: LabelProps) {
  return (
    <motion.span
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      className={classNames('sk-label', className)}
      style={style}
      data-scene-kit="label"
    >
      {children}
    </motion.span>
  )
}
