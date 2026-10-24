import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, placementStyle, type Placement } from './shared'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  /** Stable entity identity; also the shared `layoutId`. */
  id: string
  at?: Placement
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ id, at, Icon, style, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layoutId={id}
      exit={EXIT}
      data-presentation-entity={id}
      data-presentation-node="box"
      style={{ ...placementStyle(at), ...style }}
      {...rest}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden />}
      {children}
    </motion.div>
  )
}
