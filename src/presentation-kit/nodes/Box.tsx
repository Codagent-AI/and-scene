import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from '../constants'

export interface NodeProps {
  id: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  label?: string
  Icon?: LucideIcon
  entering?: boolean
  [key: `data-${string}`]: string | number | boolean | undefined
}

export function Box({ id, children, className, style, label, Icon, entering = false, ...data }: NodeProps) {
  return <motion.div layout layoutId={id} className={className} style={style} data-presentation-node="box" data-presentation-entity={id} {...data}
    initial={entering ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: entering ? ENTER_DELAY : 0 } }}>
    {Icon && <Icon aria-hidden="true" />}{label && <span>{label}</span>}{children}
  </motion.div>
}
