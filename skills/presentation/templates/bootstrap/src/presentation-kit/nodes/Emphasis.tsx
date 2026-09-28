import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface EmphasisProps {
  layoutId?: string
  className?: string
  style?: CSSProperties
  /** Whether this entity is the emphasized one right now; authors style via this hook. */
  active: boolean
  children?: ReactNode
}

/** Generic emphasis-state marker; the kit exposes the active flag, not a glow/highlight style. */
export function Emphasis({ layoutId, className, style, active, children }: EmphasisProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      className={className}
      data-presentation-node="emphasis"
      data-active={active}
      style={style}
      transition={{ duration: LAYOUT_T, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
