import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface BoxProps extends Placement {
  /** Stable entity id; continuing entities keep the same id across steps. */
  id: string
  Icon?: LucideIcon
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A positioned, morphing container. Carries `layoutId` so it persists across steps. */
export function Box({ id, Icon, className, style, children, ...place }: BoxProps) {
  return (
    <motion.div
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="box"
      data-presentation-id={id}
      className={className}
      style={placementStyle(place, style)}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph /> : null}
      {children}
    </motion.div>
  )
}
