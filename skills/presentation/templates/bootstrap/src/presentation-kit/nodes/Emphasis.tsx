import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { classNames } from './classNames'

export interface EmphasisProps {
  /** Stable identity so the emphasis marker morphs in place across steps. */
  layoutId?: string
  /** Whether the emphasis is currently visible. */
  active: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Generic emphasis-marker primitive (e.g. a highlight or focus ring target).
 * Renders nothing visual by default; presentation CSS targets the hook.
 */
export function Emphasis({ layoutId, active, className, style, children }: EmphasisProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      className={classNames('sk-emphasis', className)}
      style={style}
      data-scene-kit="emphasis"
      data-active={active ? 'true' : 'false'}
      aria-hidden={active ? undefined : 'true'}
    >
      {children}
    </motion.div>
  )
}
