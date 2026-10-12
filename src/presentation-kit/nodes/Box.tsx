import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface NodeProps {
  id: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export interface BoxProps extends NodeProps { Icon?: LucideIcon }

export function Box({ id, children, className, style, Icon, ...props }: BoxProps) {
  return <motion.div layout layoutId={id} className={className} style={style} data-presentation-node={id} {...props}>
    {Icon && <Icon aria-hidden="true" />}{children}
  </motion.div>
}
