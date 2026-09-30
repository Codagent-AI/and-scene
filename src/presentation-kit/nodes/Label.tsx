import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type LabelProps = { children: ReactNode; className?: string; layoutId: string; style?: CSSProperties }

export function Label({ children, className, layoutId, style }: LabelProps) {
  return <motion.span className={className} data-presentation-label="true" data-presentation-entity={layoutId} layoutId={layoutId} style={style}>{children}</motion.span>
}
