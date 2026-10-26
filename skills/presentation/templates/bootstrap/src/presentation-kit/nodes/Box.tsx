import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface BoxProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, 'children'> {
  /** Stable identity this entity keeps across steps, driving layout morphs. */
  layoutId: string
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ layoutId, Icon, className, children, ...rest }: BoxProps) {
  return (
    <motion.div layoutId={layoutId} data-presentation-box="" className={className} {...rest}>
      {Icon ? <Icon aria-hidden="true" data-presentation-box-icon="" /> : null}
      {children}
    </motion.div>
  )
}
