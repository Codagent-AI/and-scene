import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { classNames } from './classNames'

export interface FrameProps {
  /** Stable identity so this grouping entity morphs in place across steps. */
  layoutId?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Generic grouping primitive for composing a cluster of entities. */
export function Frame({ layoutId, className, style, children }: FrameProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      className={classNames('sk-frame', className)}
      style={style}
      data-scene-kit="frame"
    >
      {children}
    </motion.div>
  )
}
