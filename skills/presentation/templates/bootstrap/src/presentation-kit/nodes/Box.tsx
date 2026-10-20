import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { entityAttrs, type EntityProps } from './entity.ts'

type BoxProps = EntityProps & { icon?: LucideIcon }

export function Box({ id, icon: Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div {...entityAttrs(id, 'box')} {...rest}>
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
