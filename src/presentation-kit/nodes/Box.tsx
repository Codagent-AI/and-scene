import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'

export interface BoxProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, 'layout' | 'children'> {
  layoutId: string
  icon?: LucideIcon
  children?: ReactNode
}

/** Bordered card entity; presentation CSS owns border/color/spacing via the class hook. */
export function Box({ layoutId, icon: Icon, children, className, transition, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      data-presentation-box=""
      className={className}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    >
      {Icon ? <Icon data-presentation-box-icon="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
