import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { classNames } from './classNames'

export interface BoxProps {
  /** Stable identity so this entity morphs in place across steps. */
  layoutId: string
  /** Optional glyph rendered before the label content. */
  Icon?: LucideIcon
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Generic labeled entity primitive. Carries a `layoutId` for cross-step
 * morphing and stable hooks for presentation-owned styling; supplies no
 * border, palette, shadow, or card treatment of its own.
 */
export function Box({ layoutId, Icon, className, style, children }: BoxProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={classNames('sk-box', className)}
      style={style}
      data-scene-kit="box"
    >
      {Icon ? <Icon className="sk-box__icon" data-scene-kit="box-icon" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
