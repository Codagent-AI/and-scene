import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { NodeProps } from '../types'

export interface BoxProps extends NodeProps { icon?: LucideIcon; label?: string }
export function Box({ id, icon: Icon, label, className, children, ...props }: BoxProps) {
  return <motion.div layout layoutId={id} className={className} data-presentation-box="" data-entity-id={id} {...props}>
    {Icon && <Icon aria-hidden="true" />} {label && <span>{label}</span>}{children}
  </motion.div>
}
