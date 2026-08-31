import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, ENTER_T } from '../constants'

interface BoxProps {
  layoutId: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  Icon?: LucideIcon
}

export function Box({ layoutId, children, className, style, Icon }: BoxProps) {
  return (
    <motion.div
      layout
      data-presentation-node="box"
      data-presentation-entity={layoutId}
      layoutId={layoutId}
      className={className}
      style={style}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, ease: EASE }}
    >
      {Icon && <Icon aria-hidden="true" />} {children}
    </motion.div>
  )
}
