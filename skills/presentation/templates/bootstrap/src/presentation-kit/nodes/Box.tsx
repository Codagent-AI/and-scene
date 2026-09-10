import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

interface BoxProps {
  layoutId: string
  children: ReactNode
  Icon?: LucideIcon
  className?: string
  style?: CSSProperties
  id?: string
}

export function Box({ layoutId, children, Icon, className, style, id }: BoxProps) {
  return (
    <motion.div
      id={id}
      style={style}
      layout
      layoutId={layoutId}
      className={`presentation-box${className ? ` ${className}` : ''}`}
      data-presentation-box
      data-presentation-entity={layoutId}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-box-icon /> : null}
      {children}
    </motion.div>
  )
}
