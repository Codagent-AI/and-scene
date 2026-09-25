import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { nodeProps, type NodeProps } from './shared'

export function Box({ icon: Icon, children, ...props }: NodeProps & { icon?: LucideIcon }) {
  return <motion.div {...nodeProps(props, 'presentation-box')} layout transition={{ layout: { type: 'spring', stiffness: 320, damping: 34 } }}>
    {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}{children}
  </motion.div>
}
