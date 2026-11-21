import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { entityTransition } from './transitions'

interface BoxProps extends HTMLMotionProps<'div'> {
  icon?: LucideIcon
  children?: ReactNode
}

export function Box({ icon: Icon, children, ...props }: BoxProps) {
  return (
    <motion.div data-presentation-box="" layout transition={entityTransition} {...props}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
