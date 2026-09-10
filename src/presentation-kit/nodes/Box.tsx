import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type BoxProps = Omit<ComponentProps<typeof motion.div>, 'layoutId'> & {
  id: string
  icon?: LucideIcon
  children?: ReactNode
}

export function Box({ id, icon: Icon, children, className, ...props }: BoxProps) {
  return <motion.div {...props} layout layoutId={id} className={className} data-presentation-node="box" data-entity-id={id}>{Icon ? <Icon aria-hidden="true" /> : null}{children}</motion.div>
}
