import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface LabelProps { layoutId: string; children: ReactNode; className?: string; style?: CSSProperties }

export function Label({ layoutId, children, className, style }: LabelProps) {
  return <motion.span layout data-presentation-node="label" data-presentation-entity={layoutId} layoutId={layoutId} className={className} style={style}>{children}</motion.span>
}
