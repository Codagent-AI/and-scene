import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

export interface BoxProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, 'children'> {
  layoutId?: string
  icon?: LucideIcon
  children?: ReactNode
}

export function Box({ icon: Icon, className, children, ...rest }: BoxProps) {
  return (
    <motion.div layout className={className} data-presentation-node="box" {...rest}>
      {Icon ? <Icon aria-hidden="true" data-presentation-node="box-icon" /> : null}
      {children}
    </motion.div>
  )
}
